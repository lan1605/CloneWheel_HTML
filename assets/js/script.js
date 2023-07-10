var names = [];
let demos = !localStorage.getItem("content")
  ? ["Nguyễn Văn A", "Lê Văn B", "Trần Văn C", "Đặng Thị D", "Dương Thị E"]
  : localStorage.getItem("content").split(",");
var nameInput = document.getElementById("name"),
  canvasContent = document.querySelector(".content-wheel"),
  labelContent = document.querySelector(".content-label"),
  labelTextarea = document.querySelector(".label-textarea"),
  showPopup = document.querySelector(".show-popup"),
  selectTime = document.querySelector(".select-timer"),
  spinBtn = document.querySelector(".spin-btn"),
  deleteList = document.querySelector(".btn-delete"),
  sortBtn = document.querySelector(".sort-random--btn"),
  btnActionList = document.querySelectorAll(".btn-action");
var spinTimer = 0;

var audioSpin = new Audio("./assets/sound/wheel.mp3"),
  autoCongratulation = new Audio("./assets/sound/congratulation.mp3");

var shuffle = function (o) {
  for (
    var j, x, i = o.length;
    i;
    j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x
  );
  return o;
};

var hashCode = function (string) {
  var hash = 5381;
  for (i = 0; i < string.length; i++) {
    var char = string.charCodeAt(i);
    hash = (hash << 5) + hash + char;
    hash = hash & hash;
  }
  return hash;
};

var mod = function (a, b) {
  return ((a % b) + b) % b;
};
$(function () {
  wheel.segments = demos;
  nameInput.addEventListener("input", function () {
    var namesEntered = this.value
      .replace(/\r\n/g, "\n")
      .split("\n")
      .filter((line) => line);
    names = namesEntered.filter((item) => item !== " ");
    if (names === [] || names === [""]) {
    } else {
      canvasContent.style = "display: block";
      labelContent.style = "display: none";
      wheel.segments = names;
      localStorage.setItem("content", names);
    }

    wheel.init();
    wheel.update();
    setTimeout(function () {
      window.scrollTo(0, 1);
    }, 0);
  });
  !localStorage.getItem("content") ? "" : (nameInput.value = demos.join("\n"));
  wheel.init();
  wheel.update();
  setTimeout(function () {
    window.scrollTo(0, 1);
  }, 0);
  wheel.deleteAll();
});
sortBtn.addEventListener("click", function () {
  if (names.length === 0) {
    demos = demos.sort((a, b) => 0.5 - Math.random());
    nameInput.value = [demos.join("\n")];
    localStorage.setItem("content", demos);
    wheel.init();
    wheel.update();
  } else {
    names = names.sort((a, b) => 0.5 - Math.random());
    nameInput.value = [names.join("\n")];
    localStorage.setItem("content", names);
    wheel.init();
    wheel.update();
  }
});
selectTime.addEventListener("change", function () {
  wheel.upTime = selectTime.value * 1000;
  if (selectTime.value == 0) {
    spinBtn.style = `cursor: not-allowed;
    pointer-events: none;
    background: gray;`;
  } else {
    spinBtn.style = "";
  }
});

var wheel = {
  angleCurrent: 0,
  angleDelta: 0,
  canvasContext: null,
  centerX: 350,
  centerY: 350,
  colorCache: [],
  downTime: 10000,
  frames: 0,
  maxSpeed: Math.PI / names.length,
  segments: [],
  size: 340,
  spinStart: 0,
  timerDelay: 25,
  timerHandle: 0,
  upTime: 0, //thời gian quay

  //quay
  spin: function () {
    if (wheel.timerHandle == 0) {
      wheel.spinStart = new Date().getTime();
      wheel.maxSpeed = Math.PI / (20 + Math.random() * 10);
      wheel.frames = 0;
      wheel.timerHandle = setInterval(wheel.onTimerTick, wheel.timerDelay);
      wheel.closePopup();
      nameInput.disabled = true;
      audioSpin.play();
      selectTime.disabled = true;
      btnActionList.forEach((item) => {
        item.style = "pointer-events: none";
      });
    }
  },

  //tiến trình quay
  onTimerTick: function () {
    wheel.frames++;
    wheel.draw();

    var duration = new Date().getTime() - wheel.spinStart;
    var progress = 0;
    var finished = false;
    var i =
      wheel.segments.length -
      Math.floor((wheel.angleCurrent / (Math.PI * 2)) * wheel.segments.length) -
      1;
    if (duration < wheel.upTime) {
      progress = duration / wheel.upTime;
      wheel.angleDelta = wheel.maxSpeed * Math.sin((progress * Math.PI) / 2);
    } else {
      progress = duration / wheel.downTime;
      wheel.angleDelta =
        wheel.maxSpeed * Math.sin((progress * Math.PI) / 2 + Math.PI / 2);
      if (progress >= 1) {
        finished = true;
      }
    }

    wheel.angleCurrent += wheel.angleDelta;
    while (wheel.angleCurrent >= Math.PI * 2) wheel.angleCurrent -= Math.PI * 2;

    if (finished) {
      clearInterval(wheel.timerHandle);
      wheel.timerHandle = 0;
      wheel.angleDelta = 0;

      wheel.showCongratulations();
      nameInput.disabled = false;
      audioSpin.pause();
      audioSpin.currentTime = 0;
      autoCongratulation.play();
      selectTime.disabled = false;
      btnActionList.forEach((item) => {
        item.style = "";
      });
    }
  },

  //xóa toàn bộ danh sách
  deleteAll: function () {
    deleteList.addEventListener("click", function () {
      localStorage.removeItem("content");
      if (names.length === 0) {
        demos = [];
        nameInput.value = [""];
        wheel.init();
        wheel.update();
      } else {
        names = [];
        nameInput.value = [""];
        wheel.init();
        wheel.update();
      }
    });
  },

  //khởi tạo vòng quay
  init: function () {
    try {
      wheel.initWheel();
      wheel.initCanvas();
      wheel.draw();
      wheel.checkValue();
    } catch (exceptionData) {
      alert("Wheel is not loaded " + exceptionData);
    }
  },

  //kiểm tra trong textarea có giá trị hay không
  checkValue: function () {
    if (nameInput.value === "") {
      canvasContent.style = "display: none";
      labelContent.style = "display: block";
    }
  },

  //tạo vòng quay
  initCanvas: function () {
    var canvas = $("#wheel #canvas").get(0);
    // canvas.addEventListener("click", wheel.spin, false);

    spinBtn.addEventListener("click", wheel.spin, false);

    wheel.canvasContext = canvas.getContext("2d");
    // wheel.checkValue();
  },

  //lấy mã màu ngẫu nhiên
  initWheel: function () {
    shuffle(spectrum);
  },

  update: function () {
    var r = Math.floor(Math.random() * wheel.segments.length);
    wheel.angleCurrent = ((r + 0.5) / wheel.segments.length) * Math.PI * 2;

    var segments = wheel.segments;
    var len = segments.length;
    var colorLen = spectrum.length;

    var colorCache = [];
    for (var i = 0; i < len; i++) {
      var color = spectrum[mod(hashCode(segments[i]), colorLen)];
      colorCache.push(color);
    }
    wheel.colorCache = colorCache;
    wheel.draw();
  },

  draw: function () {
    wheel.clear();
    wheel.drawWheel();
    wheel.drawNeedle();
  },

  clear: function () {
    var ctx = wheel.canvasContext;
    ctx.clearRect(0, 0, 1000, 1000);
  },

  drawNeedle: function () {
    var ctx = wheel.canvasContext;
    var centerX = wheel.centerX;
    var centerY = wheel.centerY;
    var size = wheel.size;

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#4ab8ea";
    ctx.fillStyle = "#4ab8ea";

    ctx.beginPath();

    ctx.moveTo(centerX + size - 20, centerY);
    ctx.lineTo(centerX + size + 20, centerY - 10);
    ctx.lineTo(centerX + size + 20, centerY + 10);
    ctx.closePath();

    ctx.stroke();
    ctx.fill();
  },

  drawSegment: function (key, lastAngle, angle) {
    var ctx = wheel.canvasContext;
    var centerX = wheel.centerX;
    var centerY = wheel.centerY;
    var size = wheel.size;
    var value = wheel.segments[key];

    ctx.save();
    ctx.beginPath();

    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, size, lastAngle, angle, false);
    ctx.lineTo(centerX, centerY);

    ctx.fillStyle = wheel.colorCache[key];
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((lastAngle + angle) / 2);

    ctx.fillStyle = "white";
    ctx.fillText(value.substr(0, 20), size / 2 + 20, 0);
    ctx.restore();

    ctx.restore();
  },

  drawWheel: function () {
    var ctx = wheel.canvasContext;

    var angleCurrent = wheel.angleCurrent;
    var lastAngle = angleCurrent;

    var len = wheel.segments.length;

    var centerX = wheel.centerX;
    var centerY = wheel.centerY;
    var size = wheel.size;

    var PI2 = Math.PI * 2;

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = "1.4em Arial";

    for (var i = 1; i <= len; i++) {
      var angle = PI2 * (i / len) + angleCurrent;
      wheel.drawSegment(i - 1, lastAngle, angle);
      lastAngle = angle;
    }
    // Draw a center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, PI2, false);
    ctx.closePath();

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.fill();
    ctx.stroke();

    // Draw outer circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, size, 0, PI2, false);
    ctx.closePath();

    ctx.lineWidth = 10;
    ctx.strokeStyle = "#000000";
    ctx.stroke();
  },
  showCongratulations: function () {
    var i =
      wheel.segments.length -
      Math.floor((wheel.angleCurrent / (Math.PI * 2)) * wheel.segments.length) -
      1;
    if (names.length === 0) {
      var winnerDemo = demos[i];
      wheel.showPopupContent(winnerDemo);
      var deleteButton = document.querySelector(".delete-button");
      deleteButton.addEventListener("click", function () {
        wheel.deleteWinner(demos, i);
        // wheel.closePopup();
      });
    } else {
      var winnerName = names[i];
      wheel.showPopupContent(winnerName);
      var deleteButton = document.querySelector(".delete-button");
      deleteButton.addEventListener("click", function () {
        wheel.deleteWinner(names, i);
        // wheel.closePopup();
      });
    }
  },
  showPopupContent: function (text) {
    // Tạo popup chúc mừng
    showCongratulationsPopup();
    var popup = document.createElement("div");
    popup.className = "popup";
    popup.innerHTML = `
  <!-- <div class="popup-close">
  <p class="btn-close">X</p>
 </div> -->
        <div class="popup-content">
          <div class="popup-icon">️🎊</div>
          <h2 class ="popup-title">Chúc mừng!</h2>
          <p class="popup-desc">Bạn <strong>${text}</strong> đã chiến thắng!</p>
          <div class ="popup-btn">
            <button class="delete-button">Xóa tên</button>
            <button class="close-button">Đóng</button>
          </div>
        </div>
      `;
    // Hiển thị popup
    // var body = document.querySelector("body");
    showPopup.classList.add("active");
    showPopup.appendChild(popup);

    var closeButton = popup.querySelector(".close-button");
    closeButton.addEventListener("click", wheel.closePopup);
    // var closeBtn = popup.querySelector(".btn-close");
    // closeBtn.addEventListener("click", wheel.closePopup);
  },
  deleteWinner: function (arr, index) {
    arr.splice(index, 1);
    nameInput.value = [arr.join("\n")];
    localStorage.setItem("content", arr);
    wheel.update();
    wheel.closePopup();
    wheel.checkValue();
  },
  closePopup: function () {
    var popup = document.querySelector(".popup");
    if (popup) {
      popup.parentNode.removeChild(popup);
      showPopup.classList.remove("active");
    }
    var congratulation = document.querySelector(".background-congratulation");
    if (congratulation) {
      document.body.removeChild(congratulation);
    }
  },
};
document.addEventListener("click", function (event) {
  var popup = document.querySelector(".popup");
  if (popup && !popup.contains(event.target)) {
    popup.parentNode.removeChild(popup);
    showPopup.classList.remove("active");
  }
  var congratulation = document.querySelector(".background-congratulation");
  if (congratulation && !congratulation.contains(event.target)) {
    document.body.removeChild(congratulation);
  }
});

var spectrum = [
  "#A2395B",
  "#A63552",
  "#AA3149",
  "#AE2D40",
  "#B22937",
  "#A23A53",
  "#924B6F",
  "#825C8B",
  "#6F6DA7",
  "#A63570",
  "#AC2F5A",
  "#B22944",
  "#B8232E",
  "#C11C17",
  "#A72A37",
  "#8D3857",
  "#734677",
  "#575597",
  "#A6358C",
  "#B43B6A",
  "#C24148",
  "#D04726",
  "#DE5003",
  "#B84D24",
  "#924A45",
  "#6C4766",
  "#434187",
  "#A650A0",
  "#B55A80",
  "#C46460",
  "#D36E40",
  "#E27A1D",
  "#B26331",
  "#824C45",
  "#523559",
  "#1F1D6D",
  "#A660AC",
  "#B67288",
  "#C68464",
  "#D69640",
  "#E6AA19",
  "#BC892E",
  "#926843",
  "#684758",
  "#3B256D",
  "#A670B8",
  "#B8878E",
  "#CA9E64",
  "#DCB53A",
  "#EFCE10",
  "#C8A628",
  "#A17E40",
  "#7A5658",
  "#502E72",
  "#80529A",
  "#98777A",
  "#B09C5A",
  "#C8C13A",
  "#E0E61A",
  "#C8C13A",
  "#B09C5A",
  "#98777A",
  "#80529A",
  "#502E72",
  "#675860",
  "#7E824E",
  "#95AC3C",
  "#ACD62A",
  "#ABBD4D",
  "#AAA470",
  "#A98B93",
  "#A670B8",
  "#3B256D",
  "#4C4D60",
  "#5D7553",
  "#6E9D46",
  "#80C837",
  "#89AE54",
  "#929471",
  "#9B7A8E",
  "#A660AC",
  "#1F1D6D",
  "#2A3F5D",
  "#35614D",
  "#40833D",
  "#4CA82B",
  "#629248",
  "#787C65",
  "#8E6682",
  "#A650A0",
  "#434187",
  "#3B536E",
  "#336555",
  "#2B773C",
  "#228B22",
  "#43763C",
  "#646156",
  "#854C70",
  "#A6358C",
  "#575597",
  "#4A678D",
  "#3D7983",
  "#308B79",
  "#229F6E",
  "#43856E",
  "#646B6E",
  "#85516E",
  "#A63570",
  "#6F6DA7",
  "#5C7EA7",
  "#498FA7",
  "#36A0A7",
  "#20B2AA",
  "#409497",
  "#607684",
  "#805871",
  "#A2395B",
  "#7F91C3",
  "#789AC4",
  "#71A3C5",
  "#6AACC6",
  "#60B6CA",
  "#7493A6",
  "#887082",
  "#9C4D5E",
  "#B22937",
  "#71A3C5",
  "#79A9CD",
  "#81AFD5",
  "#89B5DD",
  "#93BDE7",
  "#9E95B3",
  "#A96D7F",
  "#B4454B",
  "#C11C17",
  "#60B6CA",
  "#67ADC9",
  "#6EA4C8",
  "#759BC7",
  "#7F91C3",
  "#968193",
  "#AD7163",
  "#C46133",
  "#DE5003",
  "#20B2AA",
  "#33A1AA",
  "#4690AA",
  "#597FAA",
  "#6F6DA7",
  "#8B7085",
  "#A77363",
  "#C37641",
  "#E27A1D",
  "#229F6E",
  "#2F8D78",
  "#3C7B82",
  "#49698C",
  "#575597",
  "#7A6A78",
  "#9D7F59",
  "#C0943A",
  "#E6AA19",
  "#228B22",
  "#2A793B",
  "#326754",
  "#3A556D",
  "#434187",
  "#6E646A",
  "#99874D",
  "#C4AA30",
  "#EFCE10",
  "#4CA82B",
  "#41863B",
  "#36644B",
  "#2B425B",
  "#1F1D6D",
  "#4F4F58",
  "#808244",
  "#B0B42F",
  "#E0E61A",
  "#80C837",
  "#6FA044",
  "#5E7851",
  "#4D505E",
  "#3B256D",
  "#57515C",
  "#747E4C",
  "#90AA3B",
  "#ACD62A",
];
function showCongratulationsPopup() {
  var random = Math.random,
    cos = Math.cos,
    sin = Math.sin,
    PI = Math.PI,
    PI2 = PI * 2,
    timer = undefined,
    frame = undefined,
    confetti = [];

  var spread = 4,
    sizeMin = 3,
    sizeMax = 12 - sizeMin,
    eccentricity = 10,
    deviation = 100,
    dxThetaMin = -0.1,
    dxThetaMax = -dxThetaMin - dxThetaMin,
    dyMin = 0.13,
    dyMax = 0.18,
    dThetaMin = 0.4,
    dThetaMax = 0.7 - dThetaMin;

  var colorThemes = [
    function () {
      return color(
        (200 * random()) | 0,
        (200 * random()) | 0,
        (200 * random()) | 0
      );
    },
    function () {
      var black = (200 * random()) | 0;
      return color(200, black, black);
    },
    function () {
      var black = (200 * random()) | 0;
      return color(black, 200, black);
    },
    function () {
      var black = (200 * random()) | 0;
      return color(black, black, 200);
    },
    function () {
      return color(200, 100, (200 * random()) | 0);
    },
    function () {
      return color((200 * random()) | 0, 200, 200);
    },
    function () {
      var black = (256 * random()) | 0;
      return color(black, black, black);
    },
    function () {
      return colorThemes[random() < 0.5 ? 1 : 2]();
    },
    function () {
      return colorThemes[random() < 0.5 ? 3 : 5]();
    },
    function () {
      return colorThemes[random() < 0.5 ? 2 : 4]();
    },
  ];
  function color(r, g, b) {
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  // Cosine interpolation
  function interpolation(a, b, t) {
    return ((1 - cos(PI * t)) / 2) * (b - a) + a;
  }

  var radius = 1 / eccentricity,
    radius2 = radius + radius;
  function createPoisson() {
    var domain = [radius, 1 - radius],
      measure = 1 - radius2,
      spline = [0, 1];
    while (measure) {
      var dart = measure * random(),
        i,
        l,
        interval,
        a,
        b,
        c,
        d;

      // Find where dart lies
      for (i = 0, l = domain.length, measure = 0; i < l; i += 2) {
        (a = domain[i]), (b = domain[i + 1]), (interval = b - a);
        if (dart < measure + interval) {
          spline.push((dart += a - measure));
          break;
        }
        measure += interval;
      }
      (c = dart - radius), (d = dart + radius);

      for (i = domain.length - 1; i > 0; i -= 2) {
        (l = i - 1), (a = domain[l]), (b = domain[i]);
        if (a >= c && a < d)
          if (b > d) domain[l] = d;
          else domain.splice(l, 2);
        else if (a < c && b > c)
          if (b <= d) domain[i] = c;
          else domain.splice(i, 0, c, d);
      }

      for (i = 0, l = domain.length, measure = 0; i < l; i += 2)
        measure += domain[i + 1] - domain[i];
    }

    return spline.sort();
  }

  var container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "100%";
  container.style.height = "0";
  container.style.overflow = "visible";
  container.style.zIndex = "9999";
  container.className = "background-congratulation";
  function Confetto(theme) {
    this.frame = 0;
    this.outer = document.createElement("div");
    this.inner = document.createElement("div");
    this.outer.appendChild(this.inner);

    var outerStyle = this.outer.style,
      innerStyle = this.inner.style;
    outerStyle.position = "absolute";
    outerStyle.width = sizeMin + sizeMax * random() + "px";
    outerStyle.height = sizeMin + sizeMax * random() + "px";
    innerStyle.width = "100%";
    innerStyle.height = "100%";
    innerStyle.backgroundColor = theme();

    outerStyle.perspective = "50px";
    outerStyle.transform = "rotate(" + 360 * random() + "deg)";
    this.axis =
      "rotate3D(" + cos(360 * random()) + "," + cos(360 * random()) + ",0,";
    this.theta = 360 * random();
    this.dTheta = dThetaMin + dThetaMax * random();
    innerStyle.transform = this.axis + this.theta + "deg)";

    this.x = window.innerWidth * random();
    this.y = -deviation;
    this.dx = sin(dxThetaMin + dxThetaMax * random());
    this.dy = dyMin + dyMax * random();
    outerStyle.left = this.x + "px";
    outerStyle.top = this.y + "px";

    this.splineX = createPoisson();
    this.splineY = [];
    for (var i = 1, l = this.splineX.length - 1; i < l; ++i)
      this.splineY[i] = deviation * random();
    this.splineY[0] = this.splineY[l] = deviation * random();

    this.update = function (height, delta) {
      this.frame += delta;
      this.x += this.dx * delta;
      this.y += this.dy * delta;
      this.theta += this.dTheta * delta;

      var phi = (this.frame % 7777) / 7777,
        i = 0,
        j = 1;
      while (phi >= this.splineX[j]) i = j++;
      var rho = interpolation(
        this.splineY[i],
        this.splineY[j],
        (phi - this.splineX[i]) / (this.splineX[j] - this.splineX[i])
      );
      phi *= PI2;

      outerStyle.left = this.x + rho * cos(phi) + "px";
      outerStyle.top = this.y + rho * sin(phi) + "px";
      innerStyle.transform = this.axis + this.theta + "deg)";
      return this.y > height + deviation;
    };
  }

  function poof() {
    if (!frame) {
      document.body.appendChild(container);

      var theme = colorThemes[0],
        count = 0;
      (function addConfetto() {
        var confetto = new Confetto(theme);
        confetti.push(confetto);
        container.appendChild(confetto.outer);
        timer = setTimeout(addConfetto, spread * random());
      })(0);

      var prev = undefined;
      requestAnimationFrame(function loop(timestamp) {
        var delta = prev ? timestamp - prev : 0;
        prev = timestamp;
        var height = window.innerHeight;

        for (var i = confetti.length - 1; i >= 0; --i) {
          if (confetti[i].update(height, delta)) {
            container.removeChild(confetti[i].outer);
            confetti.splice(i, 1);
          }
        }

        if (timer || confetti.length)
          return (frame = requestAnimationFrame(loop));

        document.body.removeChild(container);
        frame = undefined;
      });
    }
  }

  poof();
}
