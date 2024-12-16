let defaultMediaImageUrl = '/static/images/defaultmediaimage.png'


const maxWidth = 512;
const maxHeight = 384;

const maxTenorWidth = 512 *1.5;
const maxTenorHeight = 384 * 1.5;

function createTenorElement(msgContentElement, inputText, url) {
    let tenorURL = '';
    if (url.includes("media1.tenor.com/m/") || url.includes("c.tenor.com/")) {
        tenorURL = url;
    } else if (url.startsWith("tenor.com") || url.startsWith("https://tenor.com")) {
        tenorURL = url.endsWith(".gif") ? url : `${url}.gif`;
    }

    let imgElement = createEl('img');
    imgElement.src = defaultMediaImageUrl;
    imgElement.style.cursor = 'pointer';
    imgElement.style.maxWidth = `${maxTenorWidth}px`;
    imgElement.style.maxHeight = `${maxTenorHeight}px`;

    const actualImage = new Image();
    actualImage.src = tenorURL;
    actualImage.onload = function () {
        imgElement.src = actualImage.src;
    };
    actualImage.onerror = function () {
        imgElement.src = defaultErrorImageUrl;
        imgElement.remove();
        msgContentElement.textContent = inputText;
    };

    imgElement.addEventListener('click', function () {
        displayImagePreview(imgElement.src);
    });

    return imgElement;
}



function createImageElement(msgContentElement, inputText, url_src) {
    const imgElement = createEl('img', { class: 'imageElement' });
    imgElement.src = defaultMediaImageUrl;
    imgElement.style.maxWidth = `${maxWidth}px`;
    imgElement.style.maxHeight = `${maxHeight}px`;

    const actualImage = new Image();
    actualImage.src = url_src;
    actualImage.onload = function () {
        imgElement.src = url_src;
    };
    actualImage.onerror = function () {
        imgElement.remove();
        msgContentElement.textContent = inputText;
    };

    imgElement.addEventListener('click', function () {
        displayImagePreview(imgElement.src);
    });

    return imgElement;
}



function createAudioElement(audioURL) {
    const audioElement = createEl('audio');
    audioElement.src = audioURL;
    audioElement.controls = true; 
    return audioElement;
}
async function createJsonElement(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch JSON data');
        }
        let jsonData = await response.json();
        const beautifiedData = beautifyJson(jsonData);
        const truncatedJsonLines = beautifiedData.split('\n').slice(0, 15).join('\n');
        const jsonContainer = createEl('div');
        jsonContainer.classList.add('jsonContainer');
        const jsonElement = createEl('pre');
        jsonElement.textContent = truncatedJsonLines;
        jsonElement.style.userSelect = 'text';
        jsonElement.style.whiteSpace = 'pre-wrap';
        jsonContainer.appendChild(jsonElement);
        jsonContainer.addEventListener('click', function () {
            displayJsonPreview(beautifiedData); 
        });
        return jsonContainer;
    } catch (error) {
        console.error('Error creating JSON element:', error);
        return null;
    }
}


function createYouTubeElement(url) {
    const youtubeURL = getYouTubeEmbedURL(url);
    const iframeElement = createEl('iframe');
    iframeElement.src = youtubeURL;
    iframeElement.frameborder = '0';
    iframeElement.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframeElement.allowFullscreen = true;
    iframeElement.setAttribute("allowfullscreen", "true");
    iframeElement.setAttribute("mozallowfullscreen", "true");
    iframeElement.setAttribute("msallowfullscreen", "true");
    iframeElement.setAttribute("oallowfullscreen", "true");
    iframeElement.setAttribute("webkitallowfullscreen", "true");
    iframeElement.className = 'youtube-element';
    return iframeElement;
}


function createVideoElement(url) {
    const videoElement = createEl('video');
    videoElement.src = url;
    videoElement.width = '560';
    videoElement.height = '315';
    videoElement.controls = true; 
    return videoElement;
}
async function createMediaElement(content, messageContentElement, newMessage, attachment_urls, callback) {
    let links = extractLinks(content) || [];
    let mediaCount = 0;
    let linksProcessed = 0;

    if (attachment_urls && typeof attachment_urls === 'string' && attachment_urls.trim() !== '') {
        attachment_urls = JSON.parse(attachment_urls.replace(/\\/g, ""));
        if (attachment_urls.length > 0 && !attachment_urls[0].startsWith(`${location.origin}`)) {
            attachment_urls[0] = `${location.origin}${attachment_urls[0]}`;
        }
        links.push(...attachment_urls);
    }

    const maxLinks = 4;

    const processLinks = async () => {
        while (linksProcessed < links.length && mediaCount < maxLinks) {
            try {
                const isError = await processMediaLink(links[linksProcessed], newMessage, messageContentElement, content);
                if (!isError) {
                    mediaCount++;
                }
                linksProcessed++;
            } catch (error) {
                console.error('Error processing media link:', error);
                linksProcessed++;
            }
        }
        if (callback) {
            callback(mediaCount);
        }
    };
    
    await processLinks();
}
function processMediaLink(link, newMessage, messageContentElement, content) {
    return new Promise((resolve, reject) => {
        let mediaElement = null;
        newMessage.setAttribute('data-attachment_url', link);

        const handleMediaElement = () => {
            if (mediaElement) {
                const handleLoad = () => {
                    const dummyElement = messageContentElement.querySelector(`img[data-dummy="${link}"]`);
                    if (dummyElement) {
                        messageContentElement.replaceChild(mediaElement, dummyElement);
                    }
                    resolve();
                };

                const handleError = (error) => {
                    console.error('Error loading media element:', error);
                    const spanElement = createEl('span');
                    spanElement.textContent = "Failed to load media";
                    spanElement.style.display = 'inline-block';
                    spanElement.style.maxWidth = '100%'; 
                    spanElement.style.maxHeight = '100%'; 
                    spanElement.style.color = 'red';
                    if (mediaElement.parentNode) {
                        mediaElement.parentNode.replaceChild(spanElement, mediaElement);
                    }
                    resolve(true);
                };

                if (mediaElement instanceof HTMLImageElement || mediaElement instanceof HTMLAudioElement || mediaElement instanceof HTMLVideoElement) {
                    mediaElement.addEventListener('load', handleLoad);
                    mediaElement.addEventListener('error', handleError);
                } else {
                    messageContentElement.appendChild(mediaElement);
                    resolve();
                }
            } else {
                resolve(true);
            }
        };

        function createRegularText(content) {
            const spanElement = createEl('p', { id: 'message-content-element' });
            spanElement.textContent = content;
            spanElement.style.marginLeft = '0px';
            messageContentElement.appendChild(spanElement);
        }

        //if (!isJson && !isYt) {
        //    if (String(user_id) === String(lastSenderID)) {
        //        mediaElement.style.marginLeft = '55px';
        //    } else {
        //        mediaElement.style.marginLeft = '55px';
        //    }
        //    mediaElement.style.paddingTop = '50px';
        //}

        if (isImageURL(link) || isAttachmentUrl(link)) {
            mediaElement = document.createElement('img');
            mediaElement.src = link; 
            mediaElement.alt = 'Loading...'; 
            mediaElement.style.width = '100%'; 
            mediaElement.style.height = 'auto';
            mediaElement.dataset.dummy = link;
            messageContentElement.appendChild(mediaElement);
        } else if (isTenorURL(link)) {
            mediaElement = createTenorElement(messageContentElement, content, link);
        } else if (isYouTubeURL(link)) {
            mediaElement = createYouTubeElement(link);
        } else if (isAudioURL(link)) {
            mediaElement = createAudioElement(link);
        } else if (isVideoUrl(link)) {
            mediaElement = createVideoElement(link);
        } else if (isJsonUrl(link)) {
            mediaElement = createJsonElement(link);
        } else if (isURL(link)) {
            const urlPattern = /https?:\/\/[^\s]+/g;
            const parts = content.split(urlPattern);
            const urls = content.match(urlPattern) || [];

            parts.forEach((part, index) => {
                if (part) {
                    const normalSpan = createEl('span', { textContent: part });
                    messageContentElement.appendChild(normalSpan);
                }

                if (index < urls.length) {
                    const urlSpan = createEl('a', { textContent: urls[index] });
                    urlSpan.classList.add('url-link');
                    urlSpan.addEventListener('click', () => { openExternalUrl(urls[index]) });
                    messageContentElement.appendChild(urlSpan);
                }
            });
            displayWebPreview(messageContentElement, link);
        } else {
            createRegularText(content);
            resolve(true);
        }

        handleMediaElement();
    });
}



function appendEmbedToMessage(messageElement, url , data) {
    const embedContainer = createEl('div',{className:'embed-container'});
    const siteName = data.siteName;
    if(siteName) {
        const headerElement = createEl('p', {textContent : siteName});
        embedContainer.appendChild(headerElement);
    }
    const titleElement = createEl('a', {textContent: data.title,className: 'url-link',href: url,target: '_blank'});
    
    const descriptionElement = createEl('p', {textContent : data.description});

    embedContainer.appendChild(titleElement);
    embedContainer.appendChild(descriptionElement);
    messageElement.appendChild(embedContainer);

}

const previewsCache = new Map();
const pendingRequests = new Map();

async function displayWebPreview(messageElement, url) {
    try {
        if (previewsCache.has(url)) {
            const cachedData = previewsCache.get(url);
            appendEmbedToMessage(messageElement,url, cachedData);
            return;
        }
        if (pendingRequests.has(url)) {
            const pendingPromise = pendingRequests.get(url);
            const cachedData = await pendingPromise;
            appendEmbedToMessage(messageElement,url, cachedData);
            return;
        }

        const requestPromise = (async () => {
            try {
                const response = await fetch(`https://liventcord-link-worker.efekantunc0.workers.dev/?url=${encodeURIComponent(url)}`);
                const data = await response.json();
                if (!data.title && !data.description) {
                    console.log('No metadata found.');
                    return null; 
                }
                previewsCache.set(url, data);
                return data;
            } catch (error) {
                console.error('Error fetching web preview:', error);
                return null; 
            }
        })();

        pendingRequests.set(url, requestPromise);
        const data = await requestPromise;
        pendingRequests.delete(url);
        if (data) {
            appendEmbedToMessage(messageElement,url, data);
        }
    } catch (error) {
        console.error('Error displaying web preview:', error);
    }
}