const ChromecastAPI = require('../index.js');

const scanner = new ChromecastAPI();

const media = {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4'
};

console.log('Looking for devices');

scanner.on('device', function (device) {
    console.log('Found device: ', device);
    console.log('Total devices found: ', scanner.deviceData);
    device.on('connected', () => {
        device.play(media, function (err) {
            if (err) return console.log(err);
            console.log('Playing video in chromecast: ' + device.friendlyName);
        });
    });
});
