var parkInfo = null;
var init = false;
var long_range, lati_range;
var parks = null;

class Park {
    constructor(arr) {
        this.scale = get_scale(arr.AREA);
        this.LONGITUDE = arr.LONGITUDE;
        this.LATITUDE = arr.LATITUDE;
        this.P_PARK = arr.P_PARK;
        this.posY = map(arr.LATITUDE, lati_range[1], lati_range[0], 100, windowHeight - 100);
        let delta = (lati_range[1] - lati_range[0]) / (windowHeight - 200);
        this.posX = (this.LONGITUDE - long_range[0]) / delta + windowWidth / 2 - (long_range[1] - long_range[0]) / delta / 2;
        this.rad = sqrt(this.scale) / 20;
    }
}

function get_scale(data) {
    scale = 0;
    for (let i = 0; i < data.length; i++) {
        if ('0' <= data[i] && data[i] <= '9') {
            scale = scale * 10 + (data[i] - '0');
        } else if (data[i] == '㎡' || data[i] == '.') {
            break;
        } else if (scale == 0) {
            return null;
        }
    }
    return scale;
}

function preload(){
  font = loadFont("SeoulNamsanB.ttf");
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    var url = 'https://cors-anywhere.herokuapp.com/http://openapi.seoul.go.kr:8088/78425065416c6565313032644a674d54/json/SearchParkInfoService/1/200/';
    loadJSON(url, getParkInfo);
    textFont(font);
}

function read_parkInfos() {
    var longitude = parkInfo.row.map(x => x.LONGITUDE);
    var latitude = parkInfo.row.map(x => x.LATITUDE);

    long_range = [min(longitude), max(longitude)];
    lati_range = [min(latitude), max(latitude)];

    parks = parkInfo.row.map(x => new Park(x))
}


function draw() {
    background(255);
    textSize(70);
    fill(0);
    text("서울의 공원들", 0, 70);
  
    textSize(18);
  
    if (parkInfo && !init) {
        read_parkInfos();
        init = true;
    }
    if (parks) {
        parks.forEach(p => drawPark(p))
        p = get_near_park();

        if (p) {
          fill(color(255, 227, 15, 150));
          noStroke();
          ellipse(p.posX, p.posY, p.rad, p.rad);
          bound = font.textBounds(p.P_PARK, mouseX, mouseY, 18);
          fill(255, 255, 255, 150);
          stroke(0);
          strokeWeight(1);
          rect(mouseX - 2, mouseY - bound.h - 1, bound.w + 8, bound.h + 7, 2);
          fill(0);
          noStroke();
          text(p.P_PARK, mouseX, mouseY);
        }
    }
}

function getParkInfo(data) {
    parkInfo = data.SearchParkInfoService;
}

function get_near_park() {
    let p = null;

    for (let i = 0; i < parks.length; i++) {
        if (abs(mouseX - parks[i].posX) <= parks[i].rad/2 && abs(mouseY - parks[i].posY) <= parks[i].rad/2) {
            p = parks[i];
        }
    }

    return p;
}

function drawPark(p) {
    if (p.rad) {
        let c = lerpColor(color(201, 237, 57), color(12, 150, 58),p.rad/90);
        fill(color(red(c), green(c), blue(c), 180));
        noStroke();
        ellipse(p.posX, p.posY, p.rad, p.rad);
    }
}