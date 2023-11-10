const ChromecastAPI = require('../index.js');
const Device = require('../lib/device.js');

const scanner = new ChromecastAPI();

const media = {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4'
};

console.log('Looking for devices');

scanner.on('device', function (device) {
    console.log('Found device: ' + device);

    device.on('connected', () => {
        console.log('Starting to play');

        device.play(media, () => { });

        var join_device = new Device({ name: device.name, friendlyName: device.friendlyName, host: device.host });
        join_device.on('connected', () => {
            join_device.setVolume(0.5, (err) => {
                if (err) return console.error('Joining failed');
                console.log('Joining works!');
            });
        }, 5000);
    });
});
