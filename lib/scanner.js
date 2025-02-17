const http = require('http');
const EventEmitter = require('events');
const Ssdp = require('node-ssdp').Client;
const mdns = require('multicast-dns');
const Device = require('./device');
const parseString = require('xml2js').parseString;
const txt = require('dns-txt')();
const debug = require('debug')('chromecast-api');

class Scanner extends EventEmitter {
    constructor() {
        super();
        this.scanSSDP();
        this.scanMDNS();
        // Internal storage as data may be received as packets
        this.deviceData = {};
    }

    scanSSDP() {
        // SSDP
        this.ssdp = new Ssdp();
        this.ssdp.on('response', (headers, statusCode, rinfo) => {
            if (statusCode !== 200 || !headers.LOCATION) return;

            http.get(headers.LOCATION, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    parseString(body.toString(), { explicitArray: false, explicitRoot: false }, (err, result) => {
                        if (err) return;
                        if (!result.device || !result.device.manufacturer || !result.device.friendlyName ||
                            result.device.manufacturer.indexOf('Google') === -1) return;

                        // Friendly name
                        const matchUDN = body.match(/<UDN>(.+?)<\/UDN>/);
                        const matchFriendlyName = body.match(/<friendlyName>(.+?)<\/friendlyName>/);

                        if (!matchUDN || matchUDN.length !== 2) return;
                        if (!matchFriendlyName || matchFriendlyName.length !== 2) return;

                        // Generate chromecast style name
                        const udn = matchUDN[1];
                        const id = `Chromecast-${udn.replace(/uuid:/g, '').replace(/-/g, '')}._googlecast._tcp.local`;
                        const name = matchFriendlyName[1];
                        const host = rinfo.address;

                        this.updateDevice({ id: id, name: name, host: host });
                    });
                });
            });
        });

        // Query SSDP
        this.triggerSSDP();
    }

    triggerSSDP() {
        debug('Scanning SSDP...');
        if (this.ssdp) this.ssdp.search('urn:dial-multiscreen-org:service:dial:1');
    }

    scanMDNS() {
        // MDNS
        this.mdns = mdns();
        this.mdns.on('response', (response) => {
            const onEachAnswer = (a) => {
                let id;
                let foundDevice = null;

                if (a.type === 'PTR' && a.name === '_googlecast._tcp.local') {
                    //debug('DNS [PTR]: ', a);
                    id = a.data;
                    this.updateDevice({ id: id, name: null, host: null });
                }

                id = a.name;
                if (a.type === 'SRV') {
                    //debug('DNS [SRV]: ', a);
                    this.updateDevice({ id: id, name: null, host: a.data.target });
                }

                if (a.type === 'TXT') {
                    //debug('DNS [TXT]: ', a);

                    // Fix for array od data
                    let decodedData = {};
                    if (Array.isArray(a.data)) {
                        a.data.forEach((item) => {
                            const decodedItem = txt.decode(item);
                            Object.keys(decodedItem).forEach((key) => {
                                decodedData[key] = decodedItem[key];
                            });
                        });
                    } else {
                        decodedData = txt.decode(a.data);
                    }

                    const friendlyName = decodedData.fn || decodedData.n;
                    if (friendlyName) {
                        this.updateDevice({ id: id, name: friendlyName, host: null });
                    }
                }
            };

            response.answers.forEach(onEachAnswer);
            response.additionals.forEach(onEachAnswer);
        });

        // Query MDNS
        this.triggerMDNS();
    }

    triggerMDNS() {
        debug('Scanning MDNS...');
        if (this.mdns) this.mdns.query('_googlecast._tcp.local', 'PTR');
    }

    destroy() {
        if (this.mdns) {
            this.mdns.removeAllListeners();
            this.mdns.destroy();
            this.mdns = null;
        }

        if (this.ssdp) {
            this.ssdp.removeAllListeners();
            this.ssdp.stop();
            this.ssdp = null;
        }
    }

    updateDevice(data) {
        if (data.id) {
            if (!this.deviceData[data.id]) {
                this.deviceData[data.id] = { id: data.id, name: null, host: null, sent: false };
            }
            if (data.name) {
                this.deviceData[data.id].name = data.name;
            }
            if (data.host) {
                this.deviceData[data.id].host = data.host;
            }
            debug('Updating device: ', this.deviceData[data.id]);

            if (this.deviceData[data.id].name && this.deviceData[data.id].host && !this.deviceData[data.id].sent) {

                // Add new device
                const newDevice = new Device({
                    name: data.id,
                    friendlyName: this.deviceData[data.id].name,
                    host: this.deviceData[data.id].host
                });

                newDevice.once('close', () => {
                    debug('Removing device', this.deviceData[data.id]);
                    this.deviceData[data.id] = null;
                });

                newDevice.on('error', () => {
                    debug('Removing erroneous device', this.deviceData[data.id]);
                    newDevice.close();
                    this.deviceData[data.id] = null;
                });

                // Emit new device only when we have all the data
                debug('New device discovered', data);
                this.deviceData[data.id].sent = true;
                this.emit('device', newDevice);
            }
        }
    }

    update() {
        // Trigger again MDNS
        this.triggerMDNS();

        // Trigger again SSDP
        this.triggerSSDP();
    }
}


module.exports = Scanner;
