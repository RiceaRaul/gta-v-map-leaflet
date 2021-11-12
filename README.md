# GTA V MAP LEAFLET 
GTA V MAP LEAFLET is a MAP  based on LEAFLET.

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
For /blips/1.png we will use customIcon(1)}
```
## Screenshots
| Atlas         |   Grid        |    Satellite    | 
| ------------- | ------------- | ----------------| 
| !["Atlas Screenshot"](https://cdn.discordapp.com/attachments/691276350962794496/908677027530407966/unknown.png)  | !["Grid Screebshot"](https://cdn.discordapp.com/attachments/691276350962794496/908677312109764608/unknown.png)  |    !["Satellite Screenshot"](https://cdn.discordapp.com/attachments/691276350962794496/908676688043454495/unknown.png)             | 

Custom blip
!["Customblip Screnshot"](https://cdn.discordapp.com/attachments/691276350962794496/908677500069109800/unknown.png)
## License

GTA V MAP LEAFLET is licensed under MIT License.
