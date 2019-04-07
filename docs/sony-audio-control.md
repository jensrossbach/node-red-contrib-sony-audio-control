# Control Node
The control node of the Node-RED Sony Audio Control node collection supports the creation of requests to control a Sony audio device. The node itself is not able to communicate with the device and therefore not useable stand-alone. Rather its output must be connected to a request node in order to send requests to the device.

![Control Node](images/control_node.png)

## Configuration
In the configuration page of the node, you can choose the name of the node (if no name is provided, the default name will be "control: _command_"). Additionally the command can be chosen which will be executed unless it is overwritten by the input message. Depending on the selected command, different settings may be configured. Also here applies that parameters from the input message might (partly) overwrite the chosen settings.

The following commands can be configured. The table shows also how they map to the commands that can be specified via the input message.

|Configuration         |Command         |Description                                                                     |
|----------------------|----------------|--------------------------------------------------------------------------------|
|Get Power Status      |getPowerStatus  |Retrieve current power status of the device                                     |
|Power ON              |powerOn         |Switch on power of the device                                                   |
|Power OFF             |powerOff        |Switch off power of the device (device is not controllable via network anymore!)|
|Standby               |standby         |Switch the device into standby mode                                             |
|Get Source            |getSource       |Retrieve the currently active source on the device                              |
|Set Source            |setSource       |Set currently active source                                                     |
|Get Volume Information|getVolumeInfo   |Retrieve information about current volume and mute state                        |
|Set Volume            |setVolume       |Set current volume                                                              |
|Mute                  |mute            |Mute the audio output                                                           |
|Unmute                |unmute          |Unmute the audio output                                                         |
|Toggle Mute           |toggleMute      |Toggle between muted and unmuted audio output                                   |
|Get Sound Settings    |getSoundSettings|Retrieve current sound settings on the device                                   |
|Set Sound Settings    |setSoundSettings|Set sound settings on the device                                                |

The next table shows the mapping from configuration settings to settings which can be provided via the input message.

|Configuration         |Setting       |
|----------------------|--------------|
|Source                |type, source  |
|Port                  |port          |
|Volume                |volume        |
|Relative Volume       |relativeVolume|
|List of Sound Settings|soundSettings |
|Target                |target        |
|Zone                  |zone          |

### Sound Settings
The list of sound settings is a list where you can add new rows each representing a sound setting. You can choose the setting from the dropdown box and then depending on the selected setting, either turn the setting on or off, or select the setting's value from a second dropdown box.

## Input
The input of the control node is used to trigger an action on one side and can be utilized to overwrite the command and its settings (or a part of them) from the configurations page on the other side.

The command of the request can overwritten by specifying it in the `msg.command` argument of the input message. Command settings (e.g. the volume of a `setVolume` command) can be overwritten by adding them to the `msg.payload` argument of the input message. You can overwrite all command settings or only some of them. All settings which are not specified in the input message will be taken from the node configuration. The `msg.payload` paramter must be an object with one property for each command setting.

The following properties are defined:

|Property      |Applicable to Command|Type        |Description                                                                                |
|--------------|----------------     |------------|-------------------------------------------------------------------------------------------|
|type          |setSource            |String      |The type of the source to be activated                                                     |
|source        |setSource            |String      |The source to be activated                                                                 |
|port          |setSource            |Number [1-9]|The port for an HDMI input                                                                 |
|volume        |setVolume            |Number      |The volume to set, can either be an absolute volume (>= 0) or a relative volume step (!= 0)|
|relativeVolume|setVolume            |Boolean     |True if the provided volume is a relative volume step, false otherwise                     |
|soundSettings |setSoundSettings     |Array       |The sound settings to be activated, see below for more details                             |
|target        |getSoundSettings     |String      |The sound setting to retrieve, see below for more details                                  |
|zone          |setSource, getSource, setVolume, getVolumeInfo, mute, unmute, toggleMute|Number [1-9]|The ouput zone of the device            |

### Source
The source can be specified via the properties `type`, `source` and `port`. The latter is only needed for HDMI sources. The following combinations are possible:

|type    |source  |port    |
|--------|--------|--------|
|extInput|tv      |        |
|extInput|sat-catv|        |
|extInput|hdmi    |[1 .. 9]|
|extInput|video   |        |
|extInput|sacd-cd |        |
|extInput|bd-dvd  |        |
|extInput|line    |        |
|extInput|btAudio |        |
|extInput|game    |        |
|extInput|source  |        |
|storage |usb1    |        |
|dlna    |music   |        |
|radio   |fm      |        |

### Sound Settings
The sound settings can be specified via property `soundSettings` which is an array of objects each consisting of the properties `target` and `value`. The following combinations are possible:

|target      |value     |
|------------|----------|
|soundField  |off       |
|soundField  |standard  |
|soundField  |clearAudio|
|soundField  |music     |
|soundField  |movie     |
|soundField  |sports    |
|soundField  |game      |
|clearAudio  |off       |
|clearAudio  |on        |
|nightMode   |off       |
|nightMode   |on        |
|footballMode|off       |
|footballMode|on        |
|voice       |type1     |
|voice       |type2     |
|voice       |type3     |

## License
Copyright (c) 2019 Jens-Uwe Rossbach

This code is licensed under the MIT License.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.