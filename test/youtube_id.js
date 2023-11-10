const ChromecastAPI = require('../index.js');

const scanner = new ChromecastAPI();

console.log('Searching for devices');

scanner.on('device', function (device) {
    console.log('Found chromecast: `' + device.friendlyName + '` at ' + device.host);
    device.on('connected', () => {
        device.play({ v: 'Z7R8XRKqHAI' }, function () {
            console.log('Playing youtube video in chromecast: ' + device.friendlyName);
        });
    });
});
