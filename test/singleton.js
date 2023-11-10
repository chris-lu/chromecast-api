/**
 * This file is a simple handler for Chromecast devices.
 * 
 * It handles connections, reconnections, global broadcast and "keepalive" (to avoid application to exit)
 * 
 */

/** Define the custom application to register at https://cast.google.com/publish/#/overview */
const DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;

/** You can override APP IDs with your custom application, or build a new DefaultMediaReceiver. */
DefaultMediaReceiver.APP_ID = 'CC1AD845';

const ChromecastAPI = require('chromecast-api');

class Chromecast extends ChromecastAPI {
    constructor(config) {
        if (!Chromecast.instance) {
            super();
            Chromecast.instance = this;
            Chromecast.instance.on('device', this.listen);
            Chromecast.instance.devices = [];
            Chromecast.instance.refresh = setInterval(() => { Chromecast.instance.update(); }, 60000);
        }
        return Chromecast.instance;
    }

    static clearTimers(timers) {
        if (Array.isArray(timers)) {
            while (timers.length) {
                clearInterval(timers.pop());
            }
        }
    }

    static isValidDevice(device) {
        return device?.friendlyName?.includes('Ducky');
    }

    listen(device) {
        if (Chromecast.isValidDevice(device)) {
            console.log('Chromecast - New device: ' + device);

            if (this.devices[device.id]) {
                this.disconnect(device);
            }
            this.devices[device.id] = device;
            device.on('connected', () => {
                console.log('Chromecast - Connected to device: ' + device.friendlyName);
                this.connect(device);
                // Run the default application
                setTimeout(() => { device.play(""); }, 3000);
            });
            device.on('close', () => {
                console.log('Chromecast - Closed device: ' + device.friendlyName);
                this.disconnect(device);
            });
        }
    }

    connect(device) {
        if (device.timers) {
            Chromecast.clearTimers(device.timers);
        }
        device.timers = [];
        // Avoid the application to exit automatically
        device.timers.push(setInterval(() => { this.keepAlive(device); }, 20000));
    }

    keepAlive(device) {
        try {
            console.log('Chromecast - Keep alive...');
            device.setVolume(.8);
        }
        catch (e) {
            console.log('Chromecast - Critical error trying to keep alive the chromecast: ' + e.toString());
            this.disconnect(device);
        }
    }

    display(media, device) {
        try {
            device.getStatus((err, status) => {
                if (!err && (!status || (status && status.playerState != 'PLAYING' && status.playerState != 'BUFFERING'))) {
                    device.play(media, (err) => {
                        if (!err) {
                            console.log('Chromecast - Playing in your chromecast: ' + media);
                        }
                        else {
                            console.log('Chromecast - Error playing to the chromecast: ' + JSON.stringify(err));
                        }
                    });
                }
                else {
                    console.log('Chromecast - Is something already playing ? : ' + JSON.stringify(err) + ', ' + JSON.stringify(status));
                }
            });
        }
        catch (e) {
            console.log('Chromecast - Critical error playing to the chromecast: ' + e.toString());
            console.trace();
            this.disconnect(device);
        }
    }

    disconnect(device) {
        Chromecast.clearTimers(device.timers);
        console.log('Chromecast - Disconnected from: ' + device);
        delete this.devices[device.id];
    }

    /** The default method to broadcast to all Chromecasts */
    broadcast(media) {
        for (let i in this.devices) {
            if (Chromecast.isValidDevice(this.devices[i])) {
                this.display(media, this.devices[i]);
            }
            else {
                console.log("Chromecast - Won't broadcast on: " + this.devices[i]);
            }
        }
    }
}

module.exports = { Chromecast };