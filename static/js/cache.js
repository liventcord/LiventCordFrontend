class BaseCache {
    constructor() {
        this.data = {};
    }

    set(key, value) {
        this.data[key] = value;
    }

    get(key) {
        return this.data[key] || null;
    }

    setArray(key, value) {
        this.data[key] = Array.isArray(value) ? value : [];
    }

    setObject(key, value) {
        this.data[key] = typeof value === 'object' && value !== null ? value : {};
    }

    remove(key, id) {
        if (this.data[key]) {
            this.data[key] = this.data[key].filter(item => item !== id);
        }
    }
}
class ChannelCache extends BaseCache {
    setChannels(guildId, channels) {
        this.setArray(guildId, channels);
    }

    addChannel(guildId, channel) {
        const channels = this.getChannels(guildId);
        const index = channels.findIndex(channel => channel.id === channel.id);
        if (index === -1) {
            channels.push(channel);
            this.setChannels(guildId, channels);
        }
    }

    getChannels(guildId) {
        return this.get(guildId) || [];
    }

    updateChannel(guildId, channel, add = true) {
        const channels = this.getChannels(guildId);
        const index = channels.findIndex(channel => channel.id === channel.id);

        if (add && index === -1) {
            channels.push(channel);
        } else if (!add && index !== -1) {
            channels.splice(index, 1);
        }

        this.setChannels(guildId, channels);
    }

    addVoiceChannelMember(guildId, channelId, member) {
        const channel = this.getChannels(guildId).find(ch => ch.id === channelId);
        if (channel) {
            channel.voiceMembers = channel.voiceMembers || [];
            if (!channel.voiceMembers.some(existingMember => existingMember.id === member.id)) {
                channel.voiceMembers.push(member);
            }
        }
    }

    removeVoiceChannelMember(guildId, channelId, memberId) {
        const channel = this.getChannels(guildId).find(ch => ch.id === channelId);
        if (channel) {
            channel.voiceMembers = channel.voiceMembers.filter(member => member.id !== memberId);
        }
    }

    getVoiceChannelMembers(guildId, channelId) {
        const channel = this.getChannels(guildId).find(ch => ch.id === channelId);
        return channel ? channel.voiceMembers || [] : [];
    }
}


class GuildMembersCache extends BaseCache {
    getMembers(guildId) {
        return this.get(guildId) || [];
    }

    setMemberIds(guildId, memberIds) {
        this.set(guildId, Array.isArray(memberIds) ? memberIds : []);
    }

    updateMember(guildId, memberId, add = true) {
        const memberIds = this.getMembers(guildId);
        const index = memberIds.indexOf(memberId);

        if (add && index === -1) memberIds.push(memberId);
        else if (!add && index !== -1) memberIds.splice(index, 1);

        this.set(guildId, memberIds);
    }

    updateMembers(guildId, newMemberIds, add = true) {
        newMemberIds.forEach(memberId => this.updateMember(guildId, memberId, add));
    }
}

class MessagesCache extends BaseCache {
    setMessages(channelId, messages) {
        this.setArray(channelId, messages);
    }

    getMessages(channelId) {
        return this.get(channelId) || [];
    }

    removeMessage(messageId, channelId) {
        const messages = this.getChannelMessages(channelId).filter(msg => msg.id !== messageId);
        this.setMessages(channelId, messages);
    }
}

class InviteIdsCache extends BaseCache {
    assignInviteIds(guildId, inviteId) {
        this.setObject(guildId, inviteId);
    }

    getInviteIds(guildId) {
        return this.get(guildId) || [];
    }
}

class Guild {
    constructor(guildId) {
        this.guildId = guildId;
        this.channels = new ChannelCache();
        this.members = new GuildMembersCache();
        this.messages = new MessagesCache();
        this.invites = new InviteIdsCache();
        this.ownerId = null;
    }

    setOwner(ownerId) {
        this.ownerId = ownerId;
    }

    getOwner() {
        return this.ownerId;
    }

    isOwner(userId) {
        return this.ownerId === userId;
    }

    hasMembers() {
        return this.members.getGuildMembers(this.guildId).length > 0;
    }
}

class GuildCache {
    constructor() {
        if (GuildCache.instance) {
            return GuildCache.instance;
        }
        this.guilds = {};
        GuildCache.instance = this;
    }

    getGuild(guildId) {
        if (!this.guilds[guildId]) {
            this.guilds[guildId] = new Guild(guildId);
        }
        return this.guilds[guildId];
    }

    initialiseGuildOwnerIds(passedGuildOwnerIds) {
        if (typeof passedGuildOwnerIds !== "object" || passedGuildOwnerIds === null) {
            console.error("Invalid input: passedGuildOwnerIds must be an object.");
            return;
        }

        Object.entries(passedGuildOwnerIds).forEach(([guildId, ownerId]) => {
            this.getGuild(guildId).setOwner(ownerId);
        });
    }
}

class GuildCacheInterface {
    constructor() {
        this.guildCache = new GuildCache();
    }

    //guild
    setGuildOwner(guildId, ownerId) {
        this.getGuild(guildId)?.setOwner(ownerId);
    }

    getGuild(guildId) {
        return this.guildCache.getGuild(guildId);
    }

    //member
    getMembers(guildId) {
        return this.getGuild(guildId)?.members.getMembers(guildId) || [];
    }
    setMemberIds(guildId,membersArray) {
        this.getGuild(guildId).members.setMemberIds(membersArray) 
    }

    updateMembers(guildId, newMembers, add = true) {
        this.getGuild(guildId)?.members.updateMembers(guildId, newMembers, add);
    }

    addMember(guildId, member) {
        this.updateMembers(guildId, [member], true);
    }

    removeMember(guildId, memberId) {
        this.updateMembers(guildId, [{ id: memberId }], false);
    }

    isMembersEmpty(guildId) {
        return this.getMembers(guildId).length === 0;
    }
    //channels
    getChannels(guildId) {
        return this.getGuild(guildId)?.channels.getChannels() || [];
    }

    setChannels(guildId, channelsData) {
        this.getGuild(guildId)?.channels.setChannels(channelsData);
    }

    addChannel(guildId, channel) {
        this.getGuild(guildId)?.channels.addChannel(guildId,channel);
    }

    getGuildVoiceChannelMembers(guildId, channelId) {
        return this.getGuild(guildId)?.getVoiceChannelMembers(channelId) || [];
    }

    addMemberToVoiceChannel(guildId, channelId, member) {
        this.getGuild(guildId)?.addMemberToVoiceChannel(channelId, member);
    }

    removeMemberFromVoiceChannel(guildId, channelId, memberId) {
        this.getGuild(guildId)?.removeMemberFromVoiceChannel(channelId, memberId);
    }

    //messages
    setMessages(guildId, channelId, messages) {
        this.getGuild(guildId)?.messages.setMessages(channelId, messages);
    }

    getMessages(guildId, channelId) {
        return this.getGuild(guildId)?.messages.getMessages(channelId) || [];
    }
}

class VoiceChannelCache extends BaseCache {
    constructor(channelId) {
        super();
        this.channelId = channelId;
    }

    addUserToVoiceChannel(userId) {
        const users = this.get(this.channelId) || [];
        if (!users.includes(userId)) {
            users.push(userId);
            this.set(this.channelId, users);
        }
    }

    removeUserFromVoiceChannel(userId) {
        const users = this.get(this.channelId) || [];
        const updatedUsers = users.filter(user => user !== userId);
        this.set(this.channelId, updatedUsers);
    }

    getUsersInVoiceChannel() {
        return this.get(this.channelId) || [];
    }
}


let replyCache = {};//<messageId> <replies>
let currentMessagesCache = {};//<messageId> <messageElements>
let guildChatMessages = {};//<channelId> <messageObjects>
let messages_raw_cache = {};//<channelId> <messageRawJsons>

function hasSharedGuild(friend_id) {
    return shared_guilds_map.hasOwnProperty(friend_id);
}

const guildCache = new GuildCache();
const cacheInterface = new GuildCacheInterface();