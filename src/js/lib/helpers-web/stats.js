/**
 * Based on https://github.com/mrdoob/stats.js
 * Copyright (c) 2009-2016 stats.js authors
 * Licensed under the The MIT License
 *
 * adapted by Eric Londaits for IMAGINARY gGmbH (c) 2023
 */

const PR = Math.round(window.devicePixelRatio || 1);
const WIDTH = 80 * PR;
const HEIGHT = 48 * PR;
const TEXT_X = 3 * PR;
const TEXT_Y = 2 * PR;
const GRAPH_X = 3 * PR;
const GRAPH_Y = 15 * PR;
const GRAPH_WIDTH = 74 * PR;
const GRAPH_HEIGHT = 30 * PR;

class Panel {
  constructor(name, fg, bg) {
    this.name = name;
    this.fg = fg;
    this.bg = bg;

    this.min = Infinity;
    this.max = 0;

    this.canvas = document.createElement('canvas');
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
    this.canvas.style.cssText = 'width:80px;height:48px';

    this.context = this.canvas.getContext('2d');
    this.context.font = `bold ${9 * PR}px Helvetica,Arial,sans-serif`;
    this.context.textBaseline = 'top';
    this.context.fillStyle = this.bg;
    this.context.fillRect(0, 0, WIDTH, HEIGHT);
    this.context.fillStyle = this.fg;
    this.context.fillText(this.name, TEXT_X, TEXT_Y);
    this.context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);
    this.context.fillStyle = this.bg;
    this.context.globalAlpha = 0.9;
    this.context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);

    this.dom = this.canvas;
  }

  update(value, maxValue) {
    this.min = Math.min(this.min, value);
    this.max = Math.max(this.max, value);

    this.context.fillStyle = this.bg;
    this.context.globalAlpha = 1;
    this.context.fillRect(0, 0, WIDTH, GRAPH_Y);
    this.context.fillStyle = this.fg;
    this.context.fillText(`${Math.round(value)} ${this.name} (${Math.round(this.min)}-${Math.round(this.max)})`,
      TEXT_X,
      TEXT_Y);

    this.context.drawImage(this.canvas,
      GRAPH_X + PR,
      GRAPH_Y,
      GRAPH_WIDTH - PR,
      GRAPH_HEIGHT,
      GRAPH_X,
      GRAPH_Y,
      GRAPH_WIDTH - PR,
      GRAPH_HEIGHT);

    this.context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT);
    this.context.fillStyle = this.bg;
    this.context.globalAlpha = 0.9;
    this.context.fillRect(GRAPH_X + GRAPH_WIDTH - PR,
      GRAPH_Y,
      PR,
      Math.round((1 - (value / maxValue)) * GRAPH_HEIGHT));
  }
}

class Stats {
  constructor() {
    this.currentPanel = null;
    this.container = document.createElement('div');
    this.container.style.cssText = 'position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000';
    this.container.addEventListener('click', (event) => {
      event.preventDefault();
      this.togglePanel(false);
    });
    this.dom = this.container;

    this.beginTime = (performance || Date).now();
    this.prevTime = this.beginTime;
    this.frames = 0;

    this.lastPingTime = (performance || Date).now();
    this.maxPing = 0;
    this.pingElapsedTime = 0;

    this.panels = new Map();

    this.fpsPanel = this.addPanel('fps', new Panel('fps', '#0ff', '#002'));
    this.msPanel = this.addPanel('render', new Panel('ms', '#0f0', '#020'));
    this.pingPanel = this.addPanel('ping', new Panel('ping', '#fffb13', '#020'));

    this.showPanel(0);
  }

  addPanel(id, panel) {
    this.panels.set(id, panel);
    this.container.appendChild(panel.dom);
    return panel;
  }

  showPanel(id = null) {
    this.currentPanel = null;
    Array.from(this.panels.entries())
      .forEach(([panelId, panel], index) => {
        if (panelId === id) {
          panel.dom.style.display = 'block';
          this.currentPanel = index;
        } else {
          panel.dom.style.display = 'none';
        }
      });
  }

  showPanelNumber(index = null) {
    const panelId = Array.from(this.panels.keys())
      .find((id, i) => i === index);
    this.showPanel(panelId === undefined ? null : panelId);
  }

  togglePanel(hideAfterLast = true) {
    if (this.currentPanel === null) {
      this.currentPanel = 0;
    } else {
      this.currentPanel += 1;
      if (this.currentPanel === this.container.children.length) {
        this.currentPanel = hideAfterLast ? null : 0;
      }
    }
    this.showPanelNumber(this.currentPanel);
  }

  frameBegin() {
    this.beginTime = (performance || Date).now();
  }

  frameEnd() {
    this.frames += 1;
    const time = (performance || Date).now();
    this.msPanel.update(time - this.beginTime, 200);

    if (time >= this.prevTime + 1000) {
      this.fpsPanel.update((this.frames * 1000) / (time - this.prevTime), 100);
      this.prevTime = time;
      this.frames = 0;
    }
    return time;
  }

  ping() {
    const time = (performance || Date).now();
    const ping = time - this.lastPingTime;
    this.lastPingTime = time;
    this.maxPing = Math.max(this.maxPing, ping);
    this.pingElapsedTime += ping;
    if (this.pingElapsedTime >= 1000) {
      this.pingPanel.update(this.maxPing, 1000);
      this.pingElapsedTime = 0;
      this.maxPing = 0;
    }
  }

  update() {
    this.beginTime = this.frameEnd();
  }
}

Stats.Panel = Panel;

module.exports = Stats;
