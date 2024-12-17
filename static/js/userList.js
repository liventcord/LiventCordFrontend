let userList;

function renderTitle(titleText, container, headingLevel = 1) {
    const titleElement = createEl(`h${headingLevel}`);
    titleElement.innerText = titleText;
    titleElement.style.fontSize = '12px';
    titleElement.style.color = 'rgb(148, 155, 153)';
    container.appendChild(titleElement);
}
function createUserProfile(userData, isUserOnline) {
    const profileContainer = createEl('div', { className: 'profile-container', id: userData.userId });
    if (isUserOnline) {
        profileContainer.classList.add('activeprofile');
    }

    const userNameDiv = createEl('span', { textContent: userData.nickName, className: "profileName" });
    userNameDiv.style.color = 'white';

    const profileImg = createEl('img', { className: 'profile-pic' });
    profileImg.width = '30px';
    profileImg.height = '30px';
    profileImg.style.pointerEvents = 'none';
    profileImg.dataset.userId = userData.userId;

    const bubble = createBubble(isUserOnline);

    profileContainer.appendChild(profileImg);
    profileContainer.appendChild(userNameDiv);

    return { profileContainer, userNameDiv, profileImg, bubble };
}

function setUpEventListeners(profileImg, profileContainer, bubble, isUserOnline) {
    profileImg.addEventListener('mouseover', function () {
        this.style.borderRadius = '0px';
        bubble.style.opacity = 0;
    });
    profileImg.addEventListener('mouseout', function () {
        this.style.borderRadius = '25px';
        if (isUserOnline) bubble.style.opacity = 1;
    });

    profileContainer.addEventListener('mouseenter', function () {
        profileContainer.style.backgroundColor = 'rgb(53, 55, 60)';
    });
    profileContainer.addEventListener('mouseleave', function () {
        profileContainer.style.backgroundColor = 'initial';
    });
}

function renderUsers(users, tbody, isOnline) {
    const fragment = document.createDocumentFragment();

    for (const userData of users) {
        const isUserOnline = userData.isOnline === true;
        const userId = userData.userId;
        if (isUserOnline === isOnline) {
            const { profileContainer, userNameDiv, profileImg, bubble } = createUserProfile(userData, isUserOnline);
            const guild = guildCache.getGuild(currentGuildId);
            if (isOnGuild && currentGuildId && guild.isOwner(userId, currentGuildId)) {
                const crownEmoji = createEl('img', { src: crownEmojibase64, id: 'crown-symbol' });
                userNameDiv.appendChild(crownEmoji);
            }

            setUpEventListeners(profileImg, profileContainer, bubble, isUserOnline);

            appendToProfileContextList(userData, userId);
            setProfilePic(profileImg, userId);

            profileContainer.appendChild(bubble);
            fragment.appendChild(profileContainer);
        } else {
            console.error("is online mismatch");
        }
    }

    tbody.appendChild(fragment);
}



let isUpdatingUsers = false;


function updateMemberList(members, ignoreIsOnMe = false) {
    if (isOnMe && !ignoreIsOnMe) {
        console.log("Got users while on me page.");
        return;
    }
    if (isUpdatingUsers) {
        console.warn("Already updating members!");
        return;
    }
    console.log("Updating members with:", members);

    isUpdatingUsers = true;
    const { onlineUsers, offlineUsers } = categorizeMembers(members);
    

    userList.innerHTML = '';
    const tableWrapper = createEl('div', { className: 'user-table-wrapper' });
    const table = createEl('table', { className: 'user-table' });
    const tbody = createEl('tbody');

    if (onlineUsers.length > 0) {
        renderTitle(`ÇEVRİM İÇİ — ${onlineUsers.length}`, tbody);
        renderUsers(onlineUsers, tbody, true);
    }

    if (offlineUsers.length > 0) {
        renderTitle(`ÇEVRİM DIŞI — ${offlineUsers.length}`, tbody);
        renderUsers(offlineUsers, tbody, false);
    }

    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    userList.appendChild(tableWrapper);

    isUpdatingUsers = false;
}
function categorizeMembers(members) {
    const onlineUsers = members.filter(member => 
        member.status && member.status.toLowerCase() === "online"
    );
    const offlineUsers = members.filter(member => 
        !member.status || member.status.toLowerCase() !== "online"
    );
    return { onlineUsers, offlineUsers };
}





function createBubble(isOnline,isProfileBubble) {
    const classn = isProfileBubble ? 'profile-bubble' : 'status-bubble';
    const bubble = createEl('span',{className:classn});
    if (isOnline) {
        bubble.style.backgroundColor = '#23a55a'; 
    } else {
        bubble.style.opacity = 0;
    }

    return bubble;
}

function toggleUsersList() {
    const userList = getId('user-list');
    const isUsersOpen = userList.style.display === 'flex';
    setUsersList(!isUsersOpen);
}
let isUsersOpen = true;

function setUserListLine() {
    const userLine = document.querySelector('.horizontal-line');
    if(isUsersOpenGlobal) {
        enableElement('user-list');
        userLine.style.display = 'flex';
    } else {
        disableElement('user-list');
        userLine.style.display = 'none';
    }
}
let isUsersOpenGlobal;
function setUsersList(isUsersOpen, isLoadingFromCookie = false) {
    const displayToSet = isUsersOpen ? 'flex' : 'none';
    const inputRightToSet = isUsersOpen ? '463px' : '76px';
    const userList = getId('user-list');
    userList.style.display = displayToSet;
    
    const userLine = document.querySelector('.horizontal-line');
    if (userLine) {
        userLine.style.display = displayToSet;
    }
    const addFriendInputButton = getId('addfriendinputbutton');
    if (addFriendInputButton) {
        addFriendInputButton.style.right = inputRightToSet;
    }
    if (!isLoadingFromCookie) {
        saveBooleanCookie('isUsersOpen', isUsersOpen);
    }
    isUsersOpenGlobal = isUsersOpen;
    updateChatWidth();
}

function updateDmFriendList(friend_id,friendNick,friendDiscriminator) {
    const usersData = {
        currentUserId: {
            userId:  currentUserId,
            name: currentUserNick,
            is_online : true ,
            discriminator: currentDiscriminator
        },
        friend_id: {
            userId:  friend_id,
            name: friendNick,
            is_online : isOnline(friend_id),
            discriminator: friendDiscriminator
        }
    };
    updateMemberList(usersData);
}