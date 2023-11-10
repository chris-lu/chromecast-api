const ChromecastAPI = require('../index.js');

const scanner = new ChromecastAPI();

console.log('Searching for devices');

scanner.on('device', function (device) {
    console.log('Found chromecast: ' + device);
    device.on('connected', () => {
        device.play('https://2.img-dpreview.com/files/p/sample_galleries/6361863532/1584980320.jpg', function () {
            console.log('Playing in chromecast: ' + device.friendlyName);

            setTimeout(function () {
                device.close(function () {
                    console.log('Closed');

                    scanner.destroy();
                });
            }, 10000);
        });
    });
});
