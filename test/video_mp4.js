const ChromecastAPI = require('../index.js');

const scanner = new ChromecastAPI();

console.log('Searching for devices');

scanner.on('device', function (device) {
    console.log('Found chromecast: `' + device.friendlyName + '` at ' + device.host);
    device.on('connected', () => {
        device.play('http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4', function () {
            console.log('Playing in chromecast: ' + device.friendlyName);

            setTimeout(function () {
                device.pause(function () {
                    console.log('Paused');
                });
            }, 20000);

            setTimeout(function () {
                device.stop(function () {
                    console.log('Stopped');
                });
            }, 30000);

            setTimeout(function () {
                device.close(function () {
                    console.log('Closed');

                    // Destroy client
                    scanner.destroy(function () {
                        console.log('Client destroyed');
                    });
                });
            }, 35000);
        });
    });
});
