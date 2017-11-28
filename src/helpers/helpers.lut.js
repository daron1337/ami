import CoreUtils from '../core/core.utils';

/**
 * @module helpers/lut
 */
export default class HelpersLut {
  constructor(domTarget,
              lut = 'default',
              lutO = 'linear',
              color = [[0, 0, 0, 0], [1, 1, 1, 1]],
              opacity = [[0, 0], [1, 1]],
              discrete = false) {
    // min/max (0-1 or real intensities)
    // show/hide
    // horizontal/vertical
    if (CoreUtils.isString(domTarget)) {
      this._dom = document.getElementById(domTarget);
    } else {
      this._dom = domTarget;
    }

    this._discrete = discrete;
    this._color = color;
    this._lut = lut;
    this._luts = {[lut]: color};

    this._opacity = opacity;
    this._lutO = lutO;
    this._lutsO = {[lutO]: opacity};

    this.initCanvas();
    this.paintCanvas();
  }

  initCanvas() {
    // container
    this._canvasContainer = this.initCanvasContainer(this._dom);
    // background
    this._canvasBg = this.createCanvas();
    this._canvasContainer.appendChild(this._canvasBg);
    // foreground
    this._canvas = this.createCanvas();
    this._canvasContainer.appendChild(this._canvas);
  }

  initCanvasContainer(dom) {
    let canvasContainer = dom;
    canvasContainer.style.border = '1px solid #F9F9F9';
    return canvasContainer;
  }

  createCanvas() {
    let canvas = document.createElement('canvas');
    canvas.height = 1;
    canvas.width = 256;
    canvas.style.width = '256px';
    canvas.style.height = '16px';
    return canvas;
  }

  paintCanvas() {
    // setup context
    let ctx = this._canvas.getContext('2d');
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    ctx.globalCompositeOperation = 'source-over';

    // apply color
    if (!this._discrete) {
      let color = ctx.createLinearGradient(0, 0, this._canvas.width, 0);
      for (let i = 0; i < this._color.length; i++) {
        color.addColorStop(this._color[i][0], `rgba( ${Math.round(this._color[i][1] * 255)}, ${Math.round(this._color[i][2] * 255)}, ${Math.round(this._color[i][3] * 255)}, 1)`);
      }

      ctx.fillStyle = color;
      ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

      // setup context
      ctx.globalCompositeOperation = 'destination-in';

      // apply opacity
      let opacity = ctx.createLinearGradient(0, 0, this._canvas.width, 0);
      for (let i = 0; i < this._opacity.length; i++) {
        opacity.addColorStop(this._opacity[i][0], 'rgba(255, 255, 255, ' + this._opacity[i][1] + ')');
      }
      ctx.fillStyle = opacity;
      ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
    } else {
      ctx.lineWidth=2*this._canvas.height;

      for (let i=0; i<this._color.length; i++) {
        let currentPos = this._color[i][0];
        let nextPos = 1;
        if (i < this._color.length - 1) {
          nextPos = this._color[i+1][0];
        }
        let previousPos = 0;
        if (i > 0) {
          previousPos = this._color[i-1][0];
        }

        let from = previousPos + (currentPos - previousPos)/2;
        let to = currentPos + (nextPos - currentPos)/2;
        let color = this._color[i];
        let opacity = this._opacity[i] ? this._opacity[i][1] : 1;

        ctx.beginPath();
        ctx.strokeStyle = `rgba( ${Math.round(color[1] * 255)}, ${Math.round(color[2] * 255)}, ${Math.round(color[3] * 255)}, ${opacity})`;
        ctx.moveTo(from*this._canvas.width, 0);
        ctx.lineTo(to*this._canvas.width, 0);
        ctx.stroke();
        ctx.closePath();
      }
    }
  }

  get texture() {
    let texture = new THREE.Texture(this._canvas);
    texture.mapping = THREE.UVMapping;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.magFilter = texture.minFilter = THREE.NearestFilter;
    texture.premultiplyAlpha = true;
    texture.needsUpdate = true;
    return texture;
  }

  set lut(targetLUT) {
    this._color = this._luts[targetLUT];
    this._lut = targetLUT;

    this.paintCanvas();
  }

  get lut() {
    return this._lut;
  }

  set luts(newLuts) {
    this._luts = newLuts;
  }

  get luts() {
    return this._luts;
  }

  set lutO(targetLUTO) {
    this._opacity = this._lutsO[targetLUTO];
    this._lutO = targetLUTO;

    this.paintCanvas();
  }

  get lutO() {
    return this._lutO;
  }

  set lutsO(newLutsO) {
    this._lutsO = newLutsO;
  }

  get lutsO() {
    return this._lutsO;
  }

  set discrete(discrete) {
    this._discrete = discrete;

    this.paintCanvas();
  }

  get discrete() {
    return this._discrete;
  }

  lutsAvailable(type = 'color') {
    let available = [];
    let luts = this._luts;

    if (type !== 'color') {
      luts = this._lutsO;
    }

    for (let i in luts) {
      available.push(i);
    }

    return available;
  }

  // add luts to class' lut (so a user can add its own as well)
  static presetLuts() {
    return {
      'default': [[0, 0, 0, 0], [1, 1, 1, 1]],
      'spectrum': [[0, 0, 0, 0], [0.1, 0, 0, 1], [0.33, 0, 1, 1], [0.5, 0, 1, 0], [0.66, 1, 1, 0], [0.9, 1, 0, 0], [1, 1, 1, 1]],
      'hot_and_cold': [[0, 0, 0, 1], [0.15, 0, 1, 1], [0.3, 0, 1, 0], [0.45, 0, 0, 0], [0.5, 0, 0, 0], [0.55, 0, 0, 0], [0.7, 1, 1, 0], [0.85, 1, 0, 0], [1, 1, 1, 1]],
      'gold': [[0, 0, 0, 0], [0.13, 0.19, 0.03, 0], [0.25, 0.39, 0.12, 0], [0.38, 0.59, 0.26, 0], [0.50, 0.80, 0.46, 0.08], [0.63, 0.99, 0.71, 0.21], [0.75, 0.99, 0.88, 0.34], [0.88, 0.99, 0.99, 0.48], [1, 0.90, 0.95, 0.61]],
      'red': [[0, 0.75, 0, 0], [0.5, 1, 0.5, 0], [0.95, 1, 1, 0], [1, 1, 1, 1]],
      'green': [[0, 0, 0.75, 0], [0.5, 0.5, 1, 0], [0.95, 1, 1, 0], [1, 1, 1, 1]],
      'blue': [[0, 0, 0, 1], [0.5, 0, 0.5, 1], [0.95, 0, 1, 1], [1, 1, 1, 1]],
      'walking_dead': [[0, 0.1, 1, 1], [1, 1, 1, 1]],
      'random': [[0, 0, 0, 0], [0.27, 0.18, 0.18, 0.18], [0.41, 1, 1, 1], [0.7, 1, 0, 0], [1, 1, 1, 1]],
      'muscle_bone':[[0,0,0,0],[0.00392156862745098,0.00784313725490196,0,0],[0.00784313725490196,0.0196078431372549,0,0],[0.011764705882352941,0.03137254901960784,0,0],[0.01568627450980392,0.0392156862745098,0,0.00392156862745098],[0.0196078431372549,0.050980392156862744,0.00392156862745098,0.00392156862745098],[0.023529411764705882,0.06274509803921569,0.00392156862745098,0.00392156862745098],[0.027450980392156862,0.07058823529411765,0.00392156862745098,0.00784313725490196],[0.03137254901960784,0.08235294117647059,0.00392156862745098,0.00784313725490196],[0.03529411764705882,0.09411764705882353,0.00784313725490196,0.00784313725490196],[0.0392156862745098,0.10196078431372549,0.00784313725490196,0.00784313725490196],[0.043137254901960784,0.11372549019607843,0.00784313725490196,0.011764705882352941],[0.047058823529411764,0.12549019607843137,0.00784313725490196,0.011764705882352941],[0.050980392156862744,0.13333333333333333,0.011764705882352941,0.011764705882352941],[0.054901960784313725,0.1450980392156863,0.011764705882352941,0.01568627450980392],[0.058823529411764705,0.1568627450980392,0.011764705882352941,0.01568627450980392],[0.06274509803921569,0.16470588235294117,0.011764705882352941,0.01568627450980392],[0.06666666666666667,0.17647058823529413,0.011764705882352941,0.0196078431372549],[0.07058823529411765,0.18823529411764706,0.01568627450980392,0.0196078431372549],[0.07450980392156863,0.2,0.01568627450980392,0.0196078431372549],[0.0784313725490196,0.20784313725490197,0.01568627450980392,0.0196078431372549],[0.08235294117647059,0.2196078431372549,0.01568627450980392,0.023529411764705882],[0.08627450980392157,0.23137254901960785,0.0196078431372549,0.023529411764705882],[0.09019607843137255,0.23921568627450981,0.0196078431372549,0.023529411764705882],[0.09411764705882353,0.25098039215686274,0.0196078431372549,0.027450980392156862],[0.09803921568627451,0.2627450980392157,0.0196078431372549,0.027450980392156862],[0.10196078431372549,0.27058823529411763,0.023529411764705882,0.027450980392156862],[0.10588235294117647,0.2823529411764706,0.023529411764705882,0.027450980392156862],[0.10980392156862745,0.29411764705882354,0.023529411764705882,0.03137254901960784],[0.11372549019607843,0.30196078431372547,0.023529411764705882,0.03137254901960784],[0.11764705882352941,0.3137254901960784,0.023529411764705882,0.03137254901960784],[0.12156862745098039,0.3254901960784314,0.027450980392156862,0.03529411764705882],[0.12549019607843137,0.3333333333333333,0.027450980392156862,0.03529411764705882],[0.12941176470588237,0.34509803921568627,0.027450980392156862,0.03529411764705882],[0.13333333333333333,0.3568627450980392,0.027450980392156862,0.0392156862745098],[0.13725490196078433,0.36470588235294116,0.03137254901960784,0.0392156862745098],[0.1411764705882353,0.3764705882352941,0.03137254901960784,0.0392156862745098],[0.1450980392156863,0.38823529411764707,0.03137254901960784,0.0392156862745098],[0.14901960784313725,0.4,0.03137254901960784,0.043137254901960784],[0.15294117647058825,0.40784313725490196,0.03529411764705882,0.043137254901960784],[0.1568627450980392,0.4196078431372549,0.03529411764705882,0.043137254901960784],[0.1607843137254902,0.43137254901960786,0.03529411764705882,0.047058823529411764],[0.16470588235294117,0.4392156862745098,0.03529411764705882,0.047058823529411764],[0.16862745098039217,0.45098039215686275,0.03529411764705882,0.047058823529411764],[0.17254901960784313,0.4627450980392157,0.0392156862745098,0.047058823529411764],[0.17647058823529413,0.47058823529411764,0.0392156862745098,0.050980392156862744],[0.1803921568627451,0.4823529411764706,0.0392156862745098,0.050980392156862744],[0.1843137254901961,0.49411764705882355,0.0392156862745098,0.050980392156862744],[0.18823529411764706,0.5019607843137255,0.043137254901960784,0.054901960784313725],[0.19215686274509805,0.5137254901960784,0.043137254901960784,0.054901960784313725],[0.19607843137254902,0.5254901960784314,0.043137254901960784,0.054901960784313725],[0.2,0.5333333333333333,0.043137254901960784,0.058823529411764705],[0.20392156862745098,0.5450980392156862,0.047058823529411764,0.058823529411764705],[0.20784313725490197,0.5568627450980392,0.047058823529411764,0.058823529411764705],[0.21176470588235294,0.5647058823529412,0.047058823529411764,0.058823529411764705],[0.21568627450980393,0.5764705882352941,0.047058823529411764,0.06274509803921569],[0.2196078431372549,0.5882352941176471,0.047058823529411764,0.06274509803921569],[0.2235294117647059,0.6,0.050980392156862744,0.06274509803921569],[0.22745098039215686,0.6078431372549019,0.050980392156862744,0.06666666666666667],[0.23137254901960785,0.6196078431372549,0.050980392156862744,0.06666666666666667],[0.23529411764705882,0.6313725490196078,0.050980392156862744,0.06666666666666667],[0.23921568627450981,0.6392156862745098,0.054901960784313725,0.06666666666666667],[0.24313725490196078,0.6509803921568628,0.054901960784313725,0.07058823529411765],[0.24705882352941178,0.6627450980392157,0.054901960784313725,0.07058823529411765],[0.25098039215686274,0.6705882352941176,0.054901960784313725,0.07058823529411765],[0.2549019607843137,0.6823529411764706,0.058823529411764705,0.07450980392156863],[0.25882352941176473,0.6941176470588235,0.058823529411764705,0.07450980392156863],[0.2627450980392157,0.7019607843137254,0.058823529411764705,0.07450980392156863],[0.26666666666666666,0.7137254901960784,0.058823529411764705,0.0784313725490196],[0.27058823529411763,0.7254901960784313,0.058823529411764705,0.0784313725490196],[0.27450980392156865,0.7333333333333333,0.06274509803921569,0.0784313725490196],[0.2784313725490196,0.7450980392156863,0.06274509803921569,0.0784313725490196],[0.2823529411764706,0.7568627450980392,0.06274509803921569,0.08235294117647059],[0.28627450980392155,0.7647058823529411,0.06274509803921569,0.08235294117647059],[0.2901960784313726,0.7764705882352941,0.06666666666666667,0.08235294117647059],[0.29411764705882354,0.788235294117647,0.06666666666666667,0.08627450980392157],[0.2980392156862745,0.8,0.06666666666666667,0.08627450980392157],[0.30196078431372547,0.807843137254902,0.06666666666666667,0.08627450980392157],[0.3058823529411765,0.8196078431372549,0.07058823529411765,0.08627450980392157],[0.30980392156862746,0.8313725490196079,0.07058823529411765,0.09019607843137255],[0.3137254901960784,0.8392156862745098,0.07058823529411765,0.09019607843137255],[0.3176470588235294,0.8509803921568627,0.07058823529411765,0.09019607843137255],[0.3215686274509804,0.8627450980392157,0.07058823529411765,0.09411764705882353],[0.3254901960784314,0.8705882352941177,0.07450980392156863,0.09411764705882353],[0.32941176470588235,0.8823529411764706,0.07450980392156863,0.09411764705882353],[0.3333333333333333,0.8941176470588236,0.07450980392156863,0.09803921568627451],[0.33725490196078434,0.9019607843137255,0.07450980392156863,0.09803921568627451],[0.3411764705882353,0.9137254901960784,0.0784313725490196,0.09803921568627451],[0.34509803921568627,0.9254901960784314,0.0784313725490196,0.09803921568627451],[0.34901960784313724,0.9333333333333333,0.0784313725490196,0.10196078431372549],[0.35294117647058826,0.9450980392156862,0.0784313725490196,0.10196078431372549],[0.3568627450980392,0.9568627450980393,0.08235294117647059,0.10196078431372549],[0.3607843137254902,0.9647058823529412,0.08235294117647059,0.10588235294117647],[0.36470588235294116,0.9764705882352941,0.08235294117647059,0.10588235294117647],[0.3686274509803922,0.9882352941176471,0.08235294117647059,0.10588235294117647],[0.37254901960784315,1,0.08235294117647059,0.10588235294117647],[0.3764705882352941,1,0.09411764705882353,0.10588235294117647],[0.3803921568627451,1,0.10588235294117647,0.10588235294117647],[0.3843137254901961,1,0.11764705882352941,0.10196078431372549],[0.38823529411764707,1,0.12941176470588237,0.10196078431372549],[0.39215686274509803,1,0.1411764705882353,0.10196078431372549],[0.396078431372549,1,0.15294117647058825,0.09803921568627451],[0.4,1,0.16470588235294117,0.09803921568627451],[0.403921568627451,1,0.17647058823529413,0.09803921568627451],[0.40784313725490196,1,0.18823529411764706,0.09411764705882353],[0.4117647058823529,1,0.2,0.09411764705882353],[0.41568627450980394,1,0.21176470588235294,0.09411764705882353],[0.4196078431372549,1,0.2235294117647059,0.09019607843137255],[0.4235294117647059,1,0.23529411764705882,0.09019607843137255],[0.42745098039215684,1,0.24705882352941178,0.08627450980392157],[0.43137254901960786,1,0.25882352941176473,0.08627450980392157],[0.43529411764705883,1,0.27058823529411763,0.08627450980392157],[0.4392156862745098,1,0.2823529411764706,0.08235294117647059],[0.44313725490196076,1,0.29411764705882354,0.08235294117647059],[0.4470588235294118,1,0.3058823529411765,0.08235294117647059],[0.45098039215686275,1,0.3176470588235294,0.0784313725490196],[0.4549019607843137,1,0.32941176470588235,0.0784313725490196],[0.4588235294117647,1,0.3411764705882353,0.0784313725490196],[0.4627450980392157,1,0.35294117647058826,0.07450980392156863],[0.4666666666666667,1,0.36470588235294116,0.07450980392156863],[0.47058823529411764,1,0.3764705882352941,0.07450980392156863],[0.4745098039215686,1,0.38823529411764707,0.07058823529411765],[0.47843137254901963,1,0.4,0.07058823529411765],[0.4823529411764706,1,0.4117647058823529,0.07058823529411765],[0.48627450980392156,1,0.4235294117647059,0.06666666666666667],[0.49019607843137253,1,0.43529411764705883,0.06666666666666667],[0.49411764705882355,1,0.4470588235294118,0.06274509803921569],[0.4980392156862745,1,0.4588235294117647,0.06274509803921569],[0.5019607843137255,1,0.47058823529411764,0.06274509803921569],[0.5058823529411764,1,0.4823529411764706,0.058823529411764705],[0.5098039215686274,1,0.49411764705882355,0.058823529411764705],[0.5137254901960784,1,0.5058823529411764,0.058823529411764705],[0.5176470588235295,1,0.5137254901960784,0.054901960784313725],[0.5215686274509804,1,0.5254901960784314,0.054901960784313725],[0.5254901960784314,1,0.5372549019607843,0.054901960784313725],[0.5294117647058824,1,0.5490196078431373,0.050980392156862744],[0.5333333333333333,1,0.5607843137254902,0.050980392156862744],[0.5372549019607843,1,0.5725490196078431,0.050980392156862744],[0.5411764705882353,1,0.5843137254901961,0.047058823529411764],[0.5450980392156862,1,0.596078431372549,0.047058823529411764],[0.5490196078431373,1,0.6078431372549019,0.043137254901960784],[0.5529411764705883,1,0.6196078431372549,0.043137254901960784],[0.5568627450980392,1,0.6313725490196078,0.043137254901960784],[0.5607843137254902,1,0.6431372549019608,0.0392156862745098],[0.5647058823529412,1,0.6549019607843137,0.0392156862745098],[0.5686274509803921,1,0.6666666666666666,0.0392156862745098],[0.5725490196078431,1,0.6784313725490196,0.03529411764705882],[0.5764705882352941,1,0.6901960784313725,0.03529411764705882],[0.5803921568627451,1,0.6941176470588235,0.0392156862745098],[0.5843137254901961,1,0.7019607843137254,0.0392156862745098],[0.5882352941176471,1,0.7058823529411765,0.043137254901960784],[0.592156862745098,1,0.7098039215686275,0.043137254901960784],[0.596078431372549,1,0.7137254901960784,0.047058823529411764],[0.6,1,0.7176470588235294,0.047058823529411764],[0.6039215686274509,1,0.7254901960784313,0.050980392156862744],[0.6078431372549019,1,0.7294117647058823,0.050980392156862744],[0.611764705882353,1,0.7333333333333333,0.054901960784313725],[0.615686274509804,1,0.7372549019607844,0.058823529411764705],[0.6196078431372549,1,0.7411764705882353,0.058823529411764705],[0.6235294117647059,1,0.7490196078431373,0.06274509803921569],[0.6274509803921569,1,0.7529411764705882,0.06274509803921569],[0.6313725490196078,1,0.7568627450980392,0.06666666666666667],[0.6352941176470588,1,0.7607843137254902,0.06666666666666667],[0.6392156862745098,1,0.7647058823529411,0.07058823529411765],[0.6431372549019608,1,0.7725490196078432,0.07058823529411765],[0.6470588235294118,1,0.7764705882352941,0.07450980392156863],[0.6509803921568628,1,0.7803921568627451,0.07450980392156863],[0.6549019607843137,1,0.7843137254901961,0.0784313725490196],[0.6588235294117647,1,0.788235294117647,0.08235294117647059],[0.6627450980392157,1,0.796078431372549,0.08235294117647059],[0.6666666666666666,1,0.8,0.08627450980392157],[0.6705882352941176,1,0.803921568627451,0.08627450980392157],[0.6745098039215687,1,0.807843137254902,0.09019607843137255],[0.6784313725490196,1,0.8117647058823529,0.09019607843137255],[0.6823529411764706,1,0.8196078431372549,0.09411764705882353],[0.6862745098039216,1,0.8235294117647058,0.09411764705882353],[0.6901960784313725,1,0.8274509803921568,0.09803921568627451],[0.6941176470588235,1,0.8313725490196079,0.10196078431372549],[0.6980392156862745,1,0.8352941176470589,0.10196078431372549],[0.7019607843137254,1,0.8431372549019608,0.10588235294117647],[0.7058823529411765,1,0.8470588235294118,0.10588235294117647],[0.7098039215686275,1,0.8509803921568627,0.10980392156862745],[0.7137254901960784,1,0.8549019607843137,0.10980392156862745],[0.7176470588235294,1,0.8627450980392157,0.11372549019607843],[0.7215686274509804,1,0.8666666666666667,0.11372549019607843],[0.7254901960784313,1,0.8705882352941177,0.11764705882352941],[0.7294117647058823,1,0.8745098039215686,0.12156862745098039],[0.7333333333333333,1,0.8784313725490196,0.12156862745098039],[0.7372549019607844,1,0.8862745098039215,0.12549019607843137],[0.7411764705882353,1,0.8901960784313725,0.12549019607843137],[0.7450980392156863,1,0.8941176470588236,0.12941176470588237],[0.7490196078431373,1,0.8980392156862745,0.12941176470588237],[0.7529411764705882,1,0.9019607843137255,0.13333333333333333],[0.7568627450980392,1,0.9098039215686274,0.13333333333333333],[0.7607843137254902,1,0.9137254901960784,0.13725490196078433],[0.7647058823529411,1,0.9176470588235294,0.1411764705882353],[0.7686274509803922,1,0.9215686274509803,0.1411764705882353],[0.7725490196078432,1,0.9254901960784314,0.1450980392156863],[0.7764705882352941,1,0.9333333333333333,0.1450980392156863],[0.7803921568627451,1,0.9372549019607843,0.14901960784313725],[0.7843137254901961,1,0.9411764705882353,0.14901960784313725],[0.788235294117647,1,0.9450980392156862,0.15294117647058825],[0.792156862745098,1,0.9450980392156862,0.16862745098039217],[0.796078431372549,1,0.9490196078431372,0.1843137254901961],[0.8,1,0.9490196078431372,0.2],[0.803921568627451,1,0.9490196078431372,0.21568627450980393],[0.807843137254902,1,0.9490196078431372,0.22745098039215686],[0.8117647058823529,1,0.9529411764705882,0.24313725490196078],[0.8156862745098039,1,0.9529411764705882,0.25882352941176473],[0.8196078431372549,1,0.9529411764705882,0.27450980392156865],[0.8235294117647058,1,0.9529411764705882,0.2901960784313726],[0.8274509803921568,1,0.9568627450980393,0.3058823529411765],[0.8313725490196079,1,0.9568627450980393,0.3215686274509804],[0.8352941176470589,1,0.9568627450980393,0.33725490196078434],[0.8392156862745098,1,0.9568627450980393,0.35294117647058826],[0.8431372549019608,1,0.9607843137254902,0.3686274509803922],[0.8470588235294118,1,0.9607843137254902,0.3843137254901961],[0.8509803921568627,1,0.9607843137254902,0.4],[0.8549019607843137,1,0.9607843137254902,0.4117647058823529],[0.8588235294117647,1,0.9647058823529412,0.42745098039215684],[0.8627450980392157,1,0.9647058823529412,0.44313725490196076],[0.8666666666666667,1,0.9647058823529412,0.4588235294117647],[0.8705882352941177,1,0.9647058823529412,0.4745098039215686],[0.8745098039215686,1,0.9686274509803922,0.49019607843137253],[0.8784313725490196,1,0.9686274509803922,0.5058823529411764],[0.8823529411764706,1,0.9686274509803922,0.5215686274509804],[0.8862745098039215,1,0.9686274509803922,0.5372549019607843],[0.8901960784313725,1,0.9725490196078431,0.5529411764705883],[0.8941176470588236,1,0.9725490196078431,0.5686274509803921],[0.8980392156862745,1,0.9725490196078431,0.5843137254901961],[0.9019607843137255,1,0.9725490196078431,0.6],[0.9058823529411765,1,0.9725490196078431,0.611764705882353],[0.9098039215686274,1,0.9764705882352941,0.6274509803921569],[0.9137254901960784,1,0.9764705882352941,0.6431372549019608],[0.9176470588235294,1,0.9764705882352941,0.6588235294117647],[0.9215686274509803,1,0.9764705882352941,0.6745098039215687],[0.9254901960784314,1,0.9803921568627451,0.6901960784313725],[0.9294117647058824,1,0.9803921568627451,0.7058823529411765],[0.9333333333333333,1,0.9803921568627451,0.7215686274509804],[0.9372549019607843,1,0.9803921568627451,0.7372549019607844],[0.9411764705882353,1,0.984313725490196,0.7529411764705882],[0.9450980392156862,1,0.984313725490196,0.7686274509803922],[0.9490196078431372,1,0.984313725490196,0.7843137254901961],[0.9529411764705882,1,0.984313725490196,0.8],[0.9568627450980393,1,0.9882352941176471,0.8117647058823529],[0.9607843137254902,1,0.9882352941176471,0.8274509803921568],[0.9647058823529412,1,0.9882352941176471,0.8431372549019608],[0.9686274509803922,1,0.9882352941176471,0.8588235294117647],[0.9725490196078431,1,0.9921568627450981,0.8745098039215686],[0.9764705882352941,1,0.9921568627450981,0.8901960784313725],[0.9803921568627451,1,0.9921568627450981,0.9058823529411765],[0.984313725490196,1,0.9921568627450981,0.9215686274509803],[0.9882352941176471,1,0.996078431372549,0.9372549019607843],[0.9921568627450981,1,0.996078431372549,0.9529411764705882],[0.996078431372549,1,0.996078431372549,0.9686274509803922],[1,1,0.996078431372549,0.984313725490196]],
    };
  }

  static presetLutsO() {
    return {
      'linear': [[0, 0], [1, 1]],
      'lowpass': [[0, 0.8], [0.2, 0.6], [0.3, 0.1], [1, 0]],
      'bandpass': [[0, 0], [0.4, 0.8], [0.6, 0.8], [1, 0]],
      'highpass': [[0, 0], [0.7, 0.1], [0.8, 0.6], [1, 0.8]],
      'flat': [[0, .7], [1, 1]],
      'random': [[0, 0.], [0.38, 0.], [0.55, 1.], [0.72, 1.], [1, 0.05]],
      'linear_full': [[0,0],[0.00392156862745098,0.00392156862745098],[0.00784313725490196,0.00784313725490196],[0.011764705882352941,0.011764705882352941],[0.01568627450980392,0.01568627450980392],[0.0196078431372549,0.0196078431372549],[0.023529411764705882,0.023529411764705882],[0.027450980392156862,0.027450980392156862],[0.03137254901960784,0.03137254901960784],[0.03529411764705882,0.03529411764705882],[0.0392156862745098,0.0392156862745098],[0.043137254901960784,0.043137254901960784],[0.047058823529411764,0.047058823529411764],[0.050980392156862744,0.050980392156862744],[0.054901960784313725,0.054901960784313725],[0.058823529411764705,0.058823529411764705],[0.06274509803921569,0.06274509803921569],[0.06666666666666667,0.06666666666666667],[0.07058823529411765,0.07058823529411765],[0.07450980392156863,0.07450980392156863],[0.0784313725490196,0.0784313725490196],[0.08235294117647059,0.08235294117647059],[0.08627450980392157,0.08627450980392157],[0.09019607843137255,0.09019607843137255],[0.09411764705882353,0.09411764705882353],[0.09803921568627451,0.09803921568627451],[0.10196078431372549,0.10196078431372549],[0.10588235294117647,0.10588235294117647],[0.10980392156862745,0.10980392156862745],[0.11372549019607843,0.11372549019607843],[0.11764705882352941,0.11764705882352941],[0.12156862745098039,0.12156862745098039],[0.12549019607843137,0.12549019607843137],[0.12941176470588237,0.12941176470588237],[0.13333333333333333,0.13333333333333333],[0.13725490196078433,0.13725490196078433],[0.1411764705882353,0.1411764705882353],[0.1450980392156863,0.1450980392156863],[0.14901960784313725,0.14901960784313725],[0.15294117647058825,0.15294117647058825],[0.1568627450980392,0.1568627450980392],[0.1607843137254902,0.1607843137254902],[0.16470588235294117,0.16470588235294117],[0.16862745098039217,0.16862745098039217],[0.17254901960784313,0.17254901960784313],[0.17647058823529413,0.17647058823529413],[0.1803921568627451,0.1803921568627451],[0.1843137254901961,0.1843137254901961],[0.18823529411764706,0.18823529411764706],[0.19215686274509805,0.19215686274509805],[0.19607843137254902,0.19607843137254902],[0.2,0.2],[0.20392156862745098,0.20392156862745098],[0.20784313725490197,0.20784313725490197],[0.21176470588235294,0.21176470588235294],[0.21568627450980393,0.21568627450980393],[0.2196078431372549,0.2196078431372549],[0.2235294117647059,0.2235294117647059],[0.22745098039215686,0.22745098039215686],[0.23137254901960785,0.23137254901960785],[0.23529411764705882,0.23529411764705882],[0.23921568627450981,0.23921568627450981],[0.24313725490196078,0.24313725490196078],[0.24705882352941178,0.24705882352941178],[0.25098039215686274,0.25098039215686274],[0.2549019607843137,0.2549019607843137],[0.25882352941176473,0.25882352941176473],[0.2627450980392157,0.2627450980392157],[0.26666666666666666,0.26666666666666666],[0.27058823529411763,0.27058823529411763],[0.27450980392156865,0.27450980392156865],[0.2784313725490196,0.2784313725490196],[0.2823529411764706,0.2823529411764706],[0.28627450980392155,0.28627450980392155],[0.2901960784313726,0.2901960784313726],[0.29411764705882354,0.29411764705882354],[0.2980392156862745,0.2980392156862745],[0.30196078431372547,0.30196078431372547],[0.3058823529411765,0.3058823529411765],[0.30980392156862746,0.30980392156862746],[0.3137254901960784,0.3137254901960784],[0.3176470588235294,0.3176470588235294],[0.3215686274509804,0.3215686274509804],[0.3254901960784314,0.3254901960784314],[0.32941176470588235,0.32941176470588235],[0.3333333333333333,0.3333333333333333],[0.33725490196078434,0.33725490196078434],[0.3411764705882353,0.3411764705882353],[0.34509803921568627,0.34509803921568627],[0.34901960784313724,0.34901960784313724],[0.35294117647058826,0.35294117647058826],[0.3568627450980392,0.3568627450980392],[0.3607843137254902,0.3607843137254902],[0.36470588235294116,0.36470588235294116],[0.3686274509803922,0.3686274509803922],[0.37254901960784315,0.37254901960784315],[0.3764705882352941,0.3764705882352941],[0.3803921568627451,0.3803921568627451],[0.3843137254901961,0.3843137254901961],[0.38823529411764707,0.38823529411764707],[0.39215686274509803,0.39215686274509803],[0.396078431372549,0.396078431372549],[0.4,0.4],[0.403921568627451,0.403921568627451],[0.40784313725490196,0.40784313725490196],[0.4117647058823529,0.4117647058823529],[0.41568627450980394,0.41568627450980394],[0.4196078431372549,0.4196078431372549],[0.4235294117647059,0.4235294117647059],[0.42745098039215684,0.42745098039215684],[0.43137254901960786,0.43137254901960786],[0.43529411764705883,0.43529411764705883],[0.4392156862745098,0.4392156862745098],[0.44313725490196076,0.44313725490196076],[0.4470588235294118,0.4470588235294118],[0.45098039215686275,0.45098039215686275],[0.4549019607843137,0.4549019607843137],[0.4588235294117647,0.4588235294117647],[0.4627450980392157,0.4627450980392157],[0.4666666666666667,0.4666666666666667],[0.47058823529411764,0.47058823529411764],[0.4745098039215686,0.4745098039215686],[0.47843137254901963,0.47843137254901963],[0.4823529411764706,0.4823529411764706],[0.48627450980392156,0.48627450980392156],[0.49019607843137253,0.49019607843137253],[0.49411764705882355,0.49411764705882355],[0.4980392156862745,0.4980392156862745],[0.5019607843137255,0.5019607843137255],[0.5058823529411764,0.5058823529411764],[0.5098039215686274,0.5098039215686274],[0.5137254901960784,0.5137254901960784],[0.5176470588235295,0.5176470588235295],[0.5215686274509804,0.5215686274509804],[0.5254901960784314,0.5254901960784314],[0.5294117647058824,0.5294117647058824],[0.5333333333333333,0.5333333333333333],[0.5372549019607843,0.5372549019607843],[0.5411764705882353,0.5411764705882353],[0.5450980392156862,0.5450980392156862],[0.5490196078431373,0.5490196078431373],[0.5529411764705883,0.5529411764705883],[0.5568627450980392,0.5568627450980392],[0.5607843137254902,0.5607843137254902],[0.5647058823529412,0.5647058823529412],[0.5686274509803921,0.5686274509803921],[0.5725490196078431,0.5725490196078431],[0.5764705882352941,0.5764705882352941],[0.5803921568627451,0.5803921568627451],[0.5843137254901961,0.5843137254901961],[0.5882352941176471,0.5882352941176471],[0.592156862745098,0.592156862745098],[0.596078431372549,0.596078431372549],[0.6,0.6],[0.6039215686274509,0.6039215686274509],[0.6078431372549019,0.6078431372549019],[0.611764705882353,0.611764705882353],[0.615686274509804,0.615686274509804],[0.6196078431372549,0.6196078431372549],[0.6235294117647059,0.6235294117647059],[0.6274509803921569,0.6274509803921569],[0.6313725490196078,0.6313725490196078],[0.6352941176470588,0.6352941176470588],[0.6392156862745098,0.6392156862745098],[0.6431372549019608,0.6431372549019608],[0.6470588235294118,0.6470588235294118],[0.6509803921568628,0.6509803921568628],[0.6549019607843137,0.6549019607843137],[0.6588235294117647,0.6588235294117647],[0.6627450980392157,0.6627450980392157],[0.6666666666666666,0.6666666666666666],[0.6705882352941176,0.6705882352941176],[0.6745098039215687,0.6745098039215687],[0.6784313725490196,0.6784313725490196],[0.6823529411764706,0.6823529411764706],[0.6862745098039216,0.6862745098039216],[0.6901960784313725,0.6901960784313725],[0.6941176470588235,0.6941176470588235],[0.6980392156862745,0.6980392156862745],[0.7019607843137254,0.7019607843137254],[0.7058823529411765,0.7058823529411765],[0.7098039215686275,0.7098039215686275],[0.7137254901960784,0.7137254901960784],[0.7176470588235294,0.7176470588235294],[0.7215686274509804,0.7215686274509804],[0.7254901960784313,0.7254901960784313],[0.7294117647058823,0.7294117647058823],[0.7333333333333333,0.7333333333333333],[0.7372549019607844,0.7372549019607844],[0.7411764705882353,0.7411764705882353],[0.7450980392156863,0.7450980392156863],[0.7490196078431373,0.7490196078431373],[0.7529411764705882,0.7529411764705882],[0.7568627450980392,0.7568627450980392],[0.7607843137254902,0.7607843137254902],[0.7647058823529411,0.7647058823529411],[0.7686274509803922,0.7686274509803922],[0.7725490196078432,0.7725490196078432],[0.7764705882352941,0.7764705882352941],[0.7803921568627451,0.7803921568627451],[0.7843137254901961,0.7843137254901961],[0.788235294117647,0.788235294117647],[0.792156862745098,0.792156862745098],[0.796078431372549,0.796078431372549],[0.8,0.8],[0.803921568627451,0.803921568627451],[0.807843137254902,0.807843137254902],[0.8117647058823529,0.8117647058823529],[0.8156862745098039,0.8156862745098039],[0.8196078431372549,0.8196078431372549],[0.8235294117647058,0.8235294117647058],[0.8274509803921568,0.8274509803921568],[0.8313725490196079,0.8313725490196079],[0.8352941176470589,0.8352941176470589],[0.8392156862745098,0.8392156862745098],[0.8431372549019608,0.8431372549019608],[0.8470588235294118,0.8470588235294118],[0.8509803921568627,0.8509803921568627],[0.8549019607843137,0.8549019607843137],[0.8588235294117647,0.8588235294117647],[0.8627450980392157,0.8627450980392157],[0.8666666666666667,0.8666666666666667],[0.8705882352941177,0.8705882352941177],[0.8745098039215686,0.8745098039215686],[0.8784313725490196,0.8784313725490196],[0.8823529411764706,0.8823529411764706],[0.8862745098039215,0.8862745098039215],[0.8901960784313725,0.8901960784313725],[0.8941176470588236,0.8941176470588236],[0.8980392156862745,0.8980392156862745],[0.9019607843137255,0.9019607843137255],[0.9058823529411765,0.9058823529411765],[0.9098039215686274,0.9098039215686274],[0.9137254901960784,0.9137254901960784],[0.9176470588235294,0.9176470588235294],[0.9215686274509803,0.9215686274509803],[0.9254901960784314,0.9254901960784314],[0.9294117647058824,0.9294117647058824],[0.9333333333333333,0.9333333333333333],[0.9372549019607843,0.9372549019607843],[0.9411764705882353,0.9411764705882353],[0.9450980392156862,0.9450980392156862],[0.9490196078431372,0.9490196078431372],[0.9529411764705882,0.9529411764705882],[0.9568627450980393,0.9568627450980393],[0.9607843137254902,0.9607843137254902],[0.9647058823529412,0.9647058823529412],[0.9686274509803922,0.9686274509803922],[0.9725490196078431,0.9725490196078431],[0.9764705882352941,0.9764705882352941],[0.9803921568627451,0.9803921568627451],[0.984313725490196,0.984313725490196],[0.9882352941176471,0.9882352941176471],[0.9921568627450981,0.9921568627450981],[0.996078431372549,0.996078431372549],[1,1]],
    };
  }
}
