# GTA V MAP LEAFLET 
GTA V MAP LEAFLET is a MAP  based on LEAFLET.

**[Documentation](https://docs.ricearaul.com/gta-v-map/)**

## Features

* Easy to use
* Custom Icons
* 3 Map Style(Atlas,Satellite,Grid)

## Dependencies
Map Styles
```
  https://mega.nz/file/UKo0wI4A#hDZV1RE-KU0rF2BePRjaKQfwWVBvWbsBVAFmM7yWvo8
```
Leaflet
```
 https://leafletjs.com/
```
## Install
```
  Extract map styles in source folder
```
## How to use
Create blip
The coordinates are inverted X will be Y and Y will be X.
```
var X  = 0;
var Y = 0;
L.marker([Y,X], {icon: customIcon(1)}).addTo(Icons["Example"]).bindPopup("I am here.");
```
How use CustomIcon
The parameter in the customIcon function is the name of the .png picture in the blips folder
```
For /blips/1.png we will use customIcon(1)
```
## Screenshots
| Atlas         |   Grid        |    Satellite    | 
| ------------- | ------------- | ----------------| 
| !["Atlas Screenshot"](https://docs.ricearaul.com/gta-v-map/sattelite.png)  | !["Grid Screebshot"](https://docs.ricearaul.com//gta-v-map/atlas.png)  |    !["Satellite Screenshot"](https://docs.ricearaul.com//gta-v-map/grid.png)             | 

## Install via npm

[![npm](https://img.shields.io/npm/v/gta-v-map)](https://www.npmjs.com/package/gta-v-map)

```
npm install gta-v-map
```

## Support

If you find this project useful, consider supporting its development:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/ricearaul)

## License

GTA V MAP LEAFLET is licensed under MIT License.
