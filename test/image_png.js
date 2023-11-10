const ChromecastAPI = require('../index.js');

const scanner = new ChromecastAPI();

console.log('Searching for devices');

scanner.on('device', function (device) {
    console.log('Found chromecast: ' + device);
    device.on('connected', () => {
        device.play('https://file-examples.com/wp-content/uploads/2017/10/file_example_PNG_500kB.png', function () {
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
