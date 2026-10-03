const { isJidGroup } = require('@whiskeysockets/baileys');
const { DataTypes } = require('sequelize');
const { DATABASE } = require('./database');
const { loadMessage } = require('./store');
const config = require('../config');

// ---------- Anti-delete settings (database) ----------
const AntiDelDB = DATABASE.define('AntiDelete', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: false,
        defaultValue: 1,
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: config.ANTI_DELETE || false,
    },
}, {
    tableName: 'antidelete',
    timestamps: false,
    hooks: {
        beforeCreate: record => { record.id = 1; },
        beforeBulkCreate: records => { records.forEach(record => { record.id = 1; }); },
    },
});

let isInitialized = false;

async function initializeAntiDeleteSettings() {
    if (isInitialized) return;
    try {
        // First sync the model to ensure table exists
        await AntiDelDB.sync();
        
        // Check if old schema exists
        const tableInfo = await DATABASE.getQueryInterface().describeTable('antidelete');
        if (tableInfo.gc_status) {
            // Migrate from old schema to new schema
            const oldRecord = await DATABASE.query('SELECT * FROM antidelete WHERE id = 1', { type: DATABASE.QueryTypes.SELECT });
            if (oldRecord && oldRecord.length > 0) {
                const newStatus = oldRecord[0].gc_status || oldRecord[0].dm_status;
                await DATABASE.query('DROP TABLE antidelete');
                await AntiDelDB.sync();
                await AntiDelDB.create({ id: 1, status: newStatus });
            }
        } else {
            // Create new record if doesn't exist
            await AntiDelDB.findOrCreate({
                where: { id: 1 },
                defaults: { status: config.ANTI_DELETE || false },
            });
        }
        isInitialized = true;
    } catch (error) {
        console.error('Error initializing anti-delete settings:', error);
        // If table doesn't exist at all, create it
        if (error.original && error.original.code === 'SQLITE_ERROR' && error.original.message.includes('no such table')) {
            await AntiDelDB.sync();
            await AntiDelDB.create({ id: 1, status: config.ANTI_DELETE || false });
            isInitialized = true;
        }
    }
}

async function setAnti(status) {
    try {
        await initializeAntiDeleteSettings();
        const [affectedRows] = await AntiDelDB.update({ status }, { where: { id: 1 } });
        return affectedRows > 0;
    } catch (error) {
        console.error('Error setting anti-delete status:', error);
        return false;
    }
}

async function getAnti() {
    try {
        await initializeAntiDeleteSettings();
        const record = await AntiDelDB.findByPk(1);
        return record ? record.status : (config.ANTI_DELETE || false);
    } catch (error) {
        console.error('Error getting anti-delete status:', error);
        return config.ANTI_DELETE || false;
    }
}

// ---------- Anti-delete message handling ----------
const DeletedText = async (conn, mek, jid, deleteInfo, isGroup, update) => {
    const messageContent = mek.message?.conversation || mek.message?.extendedTextMessage?.text || 'Unknown content';
    deleteInfo += `\n📥 *MESSAGE:* ${messageContent}`;

    await conn.sendMessage(
        jid,
        {
            text: deleteInfo,
            contextInfo: {
                mentionedJid: isGroup ? [update.key.participant, mek.key.participant] : [update.key.remoteJid],
            },
        },
        { quoted: mek },
    );
};

const DeletedMedia = async (conn, mek, jid, deleteInfo) => {
    const antideletedmek = structuredClone(mek.message);
    const messageType = Object.keys(antideletedmek)[0];
    if (antideletedmek[messageType]) {
        antideletedmek[messageType].contextInfo = {
            stanzaId: mek.key.id,
            participant: mek.sender,
            quotedMessage: mek.message,
        };
    }
    if (messageType === 'imageMessage' || messageType === 'videoMessage') {
        antideletedmek[messageType].caption = deleteInfo;
    } else if (messageType === 'audioMessage' || messageType === 'documentMessage') {
        await conn.sendMessage(jid, { text: `*⚠️ Deleted Message Alert 🚨*\n${deleteInfo}` }, { quoted: mek });
    }
    await conn.relayMessage(jid, antideletedmek, {});
};

const AntiDelete = async (conn, updates) => {
    for (const update of updates) {
        if (update.update.message === null) {
            const store = await loadMessage(update.key.id);

            if (store && store.message) {
                const mek = store.message;
                const isGroup = isJidGroup(store.jid);
                const antiDeleteStatus = await getAnti();
                if (!antiDeleteStatus) continue;

                const deleteTime = new Date().toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                });

                let deleteInfo, jid;
                if (isGroup) {
                    const groupMetadata = await conn.groupMetadata(store.jid);
                    const groupName = groupMetadata.subject;
                    const sender = mek.key.participant?.split('@')[0];
                    const deleter = update.key.participant?.split('@')[0];

                    deleteInfo = `
⚠️ *ACTION:* Deleted a Message 
👤 *SENDER:* @${sender}
🗑️ *DELETED BY:* @${deleter}
⏰ *DELETE TIME:* ${deleteTime}`;
                    jid = config.ANTI_DEL_PATH === "inbox" ? conn.user.id : store.jid;
                } else {
                    const senderNumber = mek.key.remoteJid?.split('@')[0];
                    const deleterNumber = update.key.remoteJid?.split('@')[0];
                    
                    deleteInfo = `
⚠️ *ACTION:* Deleted a Message
👤 *SENDER:* @${senderNumber}
⏰ *DELETE TIME:* ${deleteTime}`;
                    jid = config.ANTI_DEL_PATH === "inbox" ? conn.user.id : update.key.remoteJid;
                }

                if (mek.message?.conversation || mek.message?.extendedTextMessage) {
                    await DeletedText(conn, mek, jid, deleteInfo, isGroup, update);
                } else {
                    await DeletedMedia(conn, mek, jid, deleteInfo);
                }
            }
        }
    }
};

module.exports = {
    DeletedText,
    DeletedMedia,
    AntiDelete,
    AntiDelDB,
    initializeAntiDeleteSettings,
    setAnti,
    getAnti,
};
