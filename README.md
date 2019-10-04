# folder-upload-webpack-plugin
> Upload your folder to ftp/sftp server easier and faster

![](https://img.shields.io/npm/v/folder-upload-webpack-plugin.svg)
[![NPM](https://nodei.co/npm/folder-upload-webpack-plugin.png)](https://nodei.co/npm/folder-upload-webpack-plugin/)

## Installation
```bash
npm i -D folder-upload-webpack-plugin
```

## Usage
add following code to your webpack config file.
```javascript
const FolderUploadWebpackPlugin = require('folder-upload-webpack-plugin');
var webpackConfig = {
  entry: 'index.js',
  output: {
    path: 'assets',
    filename: 'index_bundle.js'
  },
  plugins: [
    new FolderUploadWebpackPlugin({
        // config options, you can find options detail down here
    })
  ]
}

```
### Options Detail:

Option Name|Usage|Type|Default Value
---|:--:|:--:|:-:
host|Server's IP address|String|(none)
port|Number of ssh port| String | "22"
username|Username for authentication|String|(none)
password|optional Password for authentication|String|(none)
remotePath|Folder path on server|String|(none)
folder|local folder|String|(none)
clear|optional clear server folder before upload|Boolean|true
logging|optional show log|Boolean|false
compress|optional compress level|Int|0
chmod|optional compress level|Octal|0o644

archive|optional archive name|String|FolderUploadWebpackPlugin.zip
compressor|optional compressor class|Class|see code
ssh|optional ssh class|Class|see code
unCompress|optional compressor class|String|unzip

for other options you can see  https://github.com/mscdex/ssh2#client-methods

## Change Log

### 1.0.0
```
- init
```
