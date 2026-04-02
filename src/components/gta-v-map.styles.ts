import { css } from 'lit';

export const gtaVMapStyles = css`
  :host {
    --gta-water-color: #1a3a4a;

    display: block;
    width: 100%;
    height: 100%;
    background: var(--gta-water-color);
  }
  #map-container {
    width: 100%;
    height: 100%;
    background: var(--gta-water-color);
  }
  .leaflet-container {
    background: var(--gta-water-color) !important;
  }
  .leaflet-tile-pane {
    background: var(--gta-water-color);
  }
`;
