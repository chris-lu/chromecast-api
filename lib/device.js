const Client = require('castv2-client').Client;
const EventEmitter = require('events');
const debug = require('debug')('Device');
const utils = require('./utils');

// Supported Apps
const Youtube = require('../apps/youtube/Youtube');
const DefaultMediaReceiver = require('../apps/default/DefaultMediaReceiver');

const SUPPORTED_APPS = {
    [Youtube.APP_ID]: Youtube,
    [DefaultMediaReceiver.APP_ID]: DefaultMediaReceiver
};
const SUPPORTED_APP_IDS = Object.keys(SUPPORTED_APPS);

/**
 * Device
 * @param {Object} opts               Options
 * @param {String} opts.name          name
 * @param {String} opts.friendlyName  Friendly name
 * @param {String} opts.host          IP address
 */
class Device extends EventEmitter {
    constructor(opts) {
        super();
        this.name = opts.name;
        this.friendlyName = opts.friendlyName;
        this.host = opts.host;

        this.client = new Client(this.name);
        this.client.on('error', this.onError.bind(this));
        this.client.on('status', this.onStatus.bind(this));
        this.player = null;

        this.connect();
    }

    onError(err) {
        debug('An error occured (closing client): %s', err.message);
        this.close();
        this.client = null;
    }

    onStatus(status) {
        if (!status.applications) {
            this.emit('status', { playerState: 'IDLE' });
        }
    }

    connect(callback) {
        debug('Connecting to device: ' + this.host);
        this?.client?.connect?.(this.host, () => {
            debug('Connected');
            this.emit('connected');
            if (callback) {
                callback(null);
            }
        });
    }

    getSession(app, callback) {
        this?.client?.getSessions?.((err, sessions) => {
            if (err) return callback(err);

            const filtered = sessions.filter((session) => {
                return (app)
                    ? session.appId === app.APP_ID
                    : SUPPORTED_APP_IDS.includes(session.appId);
            });
            const session = filtered.shift();

            if (session) {
                app = app || SUPPORTED_APPS[session.appId];
                this.client.join(session, app, callback);
            } else if (app) {
                this.client.launch(app, callback);
            } else {
                callback(new Error('No session started'));
            }
        });
    }

    launch(app, callback) {
        if (this.player) {
            return callback(null, this.player);
        }

        debug('Launching app...');
        // Adding event observer for new objects
        this.getSession(app, (err, player) => {
            if (err) return callback(err);
            this.player = player;
            player.on('status', (status) => {
                debug('PlayerState = %s', status.playerState);
                this.emit('status', status);

                // Emit 'finished'
                if (status.playerState === 'IDLE' && status.idleReason === 'FINISHED') {
                    this.emit('finished');
                }
            });
            return callback(null, this.player);
        });
    }

    playYoutube(link, callback) {
        this.launch(Youtube, (err, player) => {
            if (err) return callback(err);

            player.load(link, (err, status) => {
                callback(err, status);
            });
        });
    }

    playMedia(media, opts, callback) {
        this.launch(DefaultMediaReceiver, (err, player) => {
            if (err) return callback(err);

            player.load(media, opts, (err, status) => {
                callback(err, status);
            });
        });
    }

    play(resource, opts, callback) {
        // Handle optional parameters
        if (typeof opts === 'function') {
            callback = opts;
            opts = {};
        }
        if (!opts) opts = {};
        if (!callback) callback = noop;

        resource = resource.v || resource;

        const videoId = utils.getYoutubeId(resource);
        if (videoId) {
            this.playYoutube(videoId, callback);
        } else {
            this.playMedia(resource, opts, callback);
        }
    }

    getStatus(callback) {
        if (!callback) callback = noop;

        this.launch(DefaultMediaReceiver, (err, player) => {
            if (err) return callback(err);

            player.getStatus(callback);
        });
    }

    getReceiverStatus(callback) {
        if (!callback) callback = noop;

        this.launch(DefaultMediaReceiver, (err, player) => {
            if (err) return callback(err);
            this.client.getStatus(callback);
        });
    }

    seekTo(newCurrentTime, callback) {
        if (!callback) callback = noop;

        this.launch(DefaultMediaReceiver, (err, player) => {
            if (err) return callback(err);

            player.seek(newCurrentTime, callback);
        });
    }

    seek(seconds, callback) {
        if (!callback) callback = noop;

        this.getStatus((err, status) => {
            if (err) return callback(err);
            const newCurrentTime = status.currentTime + seconds;
            this.seekTo(newCurrentTime, callback);
        });
    }

    pause(callback) {
        if (!callback) callback = noop;

        this.launch(DefaultMediaReceiver, (err, player) => {
            if (err) return callback(err);

            player.pause(callback);
        });
    }

    unpause(callback) {
        if (!callback) callback = noop;

        this.launch(DefaultMediaReceiver, (err, player) => {
            if (err) return callback(err);

            player.play(callback);
        });
    }

    resume(callback) {
        if (!callback) callback = noop;

        this.unpause(callback);
    }

    getVolume(callback) {
        if (!callback) callback = noop;

        this?.client?.getVolume?.(callback);
    }

    setVolume(volume, callback) {
        if (!callback) callback = noop;

        this?.client?.setVolume?.({ level: volume }, callback);
    }

    stop(callback) {
        if (!callback) callback = noop;

        this.launch(DefaultMediaReceiver, (err, player) => {
            if (err) return callback(err);

            player.stop(callback);
        });
    }

    setVolumeMuted(muted, callback) {
        if (!callback) callback = noop;

        this?.client?.setVolume?.({ muted }, callback);
    }

    subtitlesOff(callback) {
        if (!callback) callback = noop;

        this.launch(DefaultMediaReceiver, (err, player) => {
            if (err) return callback(err);

            player.media.sessionRequest({
                type: 'EDIT_TRACKS_INFO',
                activeTrackIds: []
            }, callback);
        });
    }

    changeSubtitles(subId, callback) {
        if (!callback) callback = noop;

        this.launch(DefaultMediaReceiver, (err, player) => {
            if (err) return callback(err);

            player.media.sessionRequest({
                type: 'EDIT_TRACKS_INFO',
                activeTrackIds: [subId]
            }, callback);
        });
    }

    changeSubtitlesSize(fontScale, callback) {
        if (!callback) callback = noop;

        this.launch(DefaultMediaReceiver, (err, player) => {
            if (err) return callback(err);

            if (!player.subtitlesStyle) return callback(new Error('Subtitle styles not defined'));

            player.subtitlesStyle.fontScale = fontScale;
            player.media.sessionRequest({
                type: 'EDIT_TRACKS_INFO',
                textTrackStyle: player.subtitlesStyle
            }, callback);
        });
    }

    getCurrentTime(callback) {
        if (!callback) callback = noop;

        this.launch(DefaultMediaReceiver, (err, player) => {
            if (err) return callback(err);

            player.getStatus(function (err, status) {
                if (err) return callback(err);

                callback(null, status.currentTime || 0);
            });
        });
    }

    close(callback) {
        if (!callback) callback = noop;

        if (this.player) {
            this?.client?.stop?.(this.player, () => {
                this.client.close();
                this.client = null;
            });
        }
        // No player was running ? Closing
        else {
            this.client.close();
            this.client = null;
        }
        this.emit('close');
        debug('Device closed');
        callback();
    }

    toString() {
        return JSON.stringify({ name: this.name, friendlyName: this.friendlyName, host: this.host });
    }
}

function noop() { }

module.exports = Device;
