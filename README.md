chromecast-api
=================

**chromecast-api** is a NodeJS module to play any content in your Chromecast device.

_This branch is fixing multiple chromecast issues and intempestive disconnections._

## Installation

```sh
npm install chromecast-api 
```

## Usage

```js
const ChromecastAPI = require('chromecast-api');

const scanner = new ChromecastAPI();

scanner.on('device', function (device) {
  device.on('connected', () => {
    var mediaURL = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4';

    device.play(mediaURL, function (err) {
      if (!err) console.log('Playing in your chromecast');
    });
  });
});
```

## Supported Apps

- Media (video and audio)
- Youtube videos


## Creating Custom Apps

1. Create your google developement profile: https://developers.google.com/cast
2. Register you device and application: https://developers.google.com/cast/docs/registration#devices
3. In the code, register your new pplication / ID in Device.SUPPORTED_APPS or override the default application ID:
```
/** Define the custom application to register at https://cast.google.com/publish/#/overview */
const DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;

/** You can override APP IDs with your custom application, or build a new DefaultMediaReceiver. */
DefaultMediaReceiver.APP_ID = 'CC1AD845';
```

## Subtitles and Cover

To include subtitles and a cover image, use an Object instead of a string in the function `play(mediaObject)`:

**Note**: your subtitles must implement CORS.

```js
const ChromecastAPI = require('chromecast-api');

const media = {
  url : 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4',
  subtitles: [
    {
      language: 'en-US',
      url: 'https://raw.githubusercontent.com/alxhotel/chromecast-api/master/test/captions_styled.vtt',
      name: 'English',
    },
    {
      language: 'es-ES',
      url: 'https://raw.githubusercontent.com/alxhotel/chromecast-api/master/test/captions_styled_es.vtt',
      name: 'Spanish',
    }
  ],
  cover: {
    title: 'Big Bug Bunny',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg'
  },
  subtitles_style: {
    backgroundColor: '#FFFFFF00', // see http://dev.w3.org/csswg/css-color/#hex-notation
    foregroundColor: '#FFFFFFFF', // see http://dev.w3.org/csswg/css-color/#hex-notation
    edgeType: 'OUTLINE', // can be: "NONE", "OUTLINE", "DROP_SHADOW", "RAISED", "DEPRESSED"
    edgeColor: '#000000FF', // see http://dev.w3.org/csswg/css-color/#hex-notation
    fontScale: 1.2, // transforms into "font-size: " + (fontScale*100) +"%"
    fontStyle: 'BOLD', // can be: "NORMAL", "BOLD", "BOLD_ITALIC", "ITALIC",
    fontFamily: 'Droid Sans',
    fontGenericFamily: 'SANS_SERIF', // can be: "SANS_SERIF", "MONOSPACED_SANS_SERIF", "SERIF", "MONOSPACED_SERIF", "CASUAL", "CURSIVE", "SMALL_CAPITALS",
    //windowColor: '#AA00FFFF', // see http://dev.w3.org/csswg/css-color/#hex-notation
    //windowRoundedCornerRadius: 10, // radius in px
    //windowType: 'ROUNDED_CORNERS' // can be: "NONE", "NORMAL", "ROUNDED_CORNERS"
  }
}

const scanner = new ChromecastAPI();

scanner.on('device', function (device) {
  device.on('connected', () => {
    device.play(media, function (err) {
      if (!err) console.log('Playing in your chromecast');
    });
  });
});
```

## API

#### `const scanner = new ChromecastAPI()`

Initialize the scanner to start searching for chromecast devices.

#### `scanner.on('device', callback)`

Listen for new devices by passing `callback(device)` in the callback parameter.

With the `Device` object you can now interact with your Chromecast.

This is an example of the attributes of `device`:
```
{
  name: 'Chromecast-e363e7-3e23e2e-3e2e-23e34e._googlecast._tcp.local', // Unique identifier
  friendlyName: 'Bobby', // The name you gave to your chromecast
  host: '192.168.1.10' // Local IP address
}
```

#### `scanner.update()`

Trigger the mDNS and SSDP search again. Warning: the `device` event will trigger again (it might return the same device).

#### `device.play(mediaURL [, opts], callback)`

Use this function to play any media in the chromecast device. Make sure `mediaURL` is accessible by the chromecast.

Pass an attribute `startTime` in the `opts` object to set where to start an audio or video content (in seconds).

```
{
  startTime: 120 // Start the content at the 2 minute mark
}
```

#### `device.pause(callback)`

Pause the media.

#### `device.resume(callback)`

Resume the media.

#### `device.stop(callback)`

Stop playing the media.

#### `device.seek(seconds, callback)`

Seek forward `seconds` in time.

#### `device.seekTo(specificTime, callback)`

Seek to the `specificTime` in seconds.

#### `device.setVolume(level, callback)`

Set the volume to a specific `level` (from 0.0 to 1.0).

#### `device.changeSubtitles(index, callback)`

Change the subtitles by passing the index of the subtitle you want based on the list you passed before.

#### `device.changeSubtitlesSize(fontSize, callback)`

Choose the subtitles font size with `fontSize`. The default is `1.0`.

#### `device.subtitlesOff(callback)`

Turn the subtitles off.

#### `device.getCurrentTime(callback)`

Get the current time of the media playing (in seconds). It's a shortcut for getting the `currentTime` from the status.

#### `device.close(callback)`

Close the connection with the device.

#### `device.on('connected', callback)`

Event emitted when the client is connected to the device.

#### `device.on('finished', callback)`

Event emitted when the media (audio or video) has finished.

#### `device.on('status', callback)`

Event emitted when the device has a new status: `callback(status)`.

## Additional information

* Supported Media: https://developers.google.com/cast/docs/media
* Receiver Apps: https://developers.google.com/cast/docs/receiver_apps

## License

MIT. Copyright (c) [Alex](https://github.com/alxhotel)

