window.onload = function() {
    initVConsole();
    const useNodeJS = true;   // if you are not using a node server, set this value to false
    const defaultLiffId = ""   // change the default LIFF value if you are not using a node server

    // DO NOT CHANGE THIS
    let myLiffId = "";

    // if node is used, fetch the environment variable and pass it to the LIFF method
    // otherwise, pass defaultLiffId
    if (useNodeJS) {
        fetch('/send-id')
            .then(function(reqResponse) {
                return reqResponse.json();
            })
            .then(function(jsonResponse) {
                myLiffId = jsonResponse.id;
                initializeLiff(myLiffId);
            })
            .catch(function(error) {
                console.log(error);
            });
    } else {
        myLiffId = defaultLiffId;
        initializeLiff(myLiffId);
    }
};

// Initialize vConsole
function initVConsole() {
    console.log('function initVConsole called')
    window.vConsole = new window.VConsole({
        defaultPlugins: ['system', 'network', 'element', 'storage'],
        maxLogNumber: 1000,
        onReady: function() {
            console.log('vConsole is ready.');
        },
        onClearLog: function() {
            console.log('on clearLog');
        }
    });
}

/**
* Initialize LIFF
* @param {string} myLiffId The LIFF ID of the selected element
*/
function initializeLiff(myLiffId) {
    console.log('function initializeLiff called')
    liff
        .init({
            liffId: myLiffId
        })
        .then(() => {
            // start to use LIFF's api
            initializeApp();
        })
        .catch((err) => {
            window.alert('Something went wrong with LIFF initialization.');
        });
}

/**
 * Initialize the app by calling functions handling individual app components
 */
function initializeApp() {
    console.log('function initializeApp called')
    registerButtonHandlers();

}

function registerButtonHandlers() {
    console.log('function registerButtonHandlers called')
    // closeWindow call
/* 閉じるボタンは非表示
    document.getElementById('closeWindowButton').addEventListener('click', function() {
        if (!liff.isInClient()) {
            sendAlertIfNotInClient();
        } else {
            liff.closeWindow();
        }
    });
*/
    // sendMessages call
    document.getElementById('sendMessageButton').addEventListener('click', function() {
        if (!liff.isInClient()) {
            sendAlertIfNotInClient();
        } else {
            liff.getProfile().then(function(profile) {
                saveImage(profile.userId)
                .then(sendImage)
                .then((response) => {
                    console.log(response);
                });
            });
        }
    });
}

function saveImage(userId) {
    return new Promise((resolve, reject) => {
        const base64 = canvas.toDataURL("image/png");
        //console.log(base64)
        axios.post('/save', {
            pad: base64 + ',' + userId
        })
        .then(function (response) {
            console.log(response.data.name);
            resolve(response.data.name);
        })
        .catch(function (error) {
            console.log(error);
        });
    })
}

function sendImage(fileName) {
    console.log('***' + fileName);
    return new Promise((resolve, reject) => {
        liff.sendMessages([{
            'type': 'image',
            'originalContentUrl': 'https://' + document.domain + '/imgs/' + fileName,
            'previewImageUrl': 'https://' + document.domain + '/imgs/' + fileName
        }]).then(function() {
            //window.alert('Message sent');
            // LIFFを閉じる
            liff.closeWindow();
        }).catch(function(error) {
            window.alert('Error sending message: ' + error);
        });
    })
}


/**
* Alert the user if LIFF is opened in an external browser and unavailable buttons are tapped
*/
function sendAlertIfNotInClient() {
    alert('This button is unavailable as LIFF is currently being opened in an external browser.');
}

/* お絵描き */
// check userAgent
var ua = navigator.userAgent;
if (ua.indexOf('iPhone') > 0) {
    ua = 'iphone';
} else if (ua.indexOf('iPod') > 0 || ua.indexOf('Android') > 0 && ua.indexOf('Mobile') > 0) {
    ua = 'sp';
} else if (ua.indexOf('iPad') > 0 || ua.indexOf('Android') > 0) {
    ua = 'tab';
} else {
    ua = 'other';
}

// check event
var EVENT = {};
if (ua != 'other') {
    // touch panel
    EVENT.TOUCH_START = 'touchstart';
    EVENT.TOUCH_MOVE = 'touchmove';
    EVENT.TOUCH_END = 'touchend';
} else {
    // mouse
    EVENT.TOUCH_START = 'mousedown';
    EVENT.TOUCH_MOVE = 'mousemove';
    EVENT.TOUCH_END = 'mouseup';
}

var startX = 0;
var startY = 0;
var mousedown = false;

var canvas = document.getElementById('canvas');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
var ctx = canvas.getContext('2d');

window.addEventListener('load', function() {

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    var clientRect = canvas.getBoundingClientRect();
    var canvas_x = clientRect.left;
    var canvas_y = clientRect.top;

    var img_datas_cnt = 0;
    var img_datas_arr = new Array();

    // when resize window
/*
    window.addEventListener('resize', function (event) {
	      // canvasの位置座標を取得（描いたものを伸縮させないため、キャンバスの大きさを変える）
        clientRect = canvas.getBoundingClientRect();
    	  canvas_x = clientRect.left;
	      canvas_y = clientRect.top;
	      canvas.width = canvas.clientWidth;
	      canvas.height = canvas.clientHeight;

      	// 一度消して、保存していた配列データを全て描く（ウィンドウを大きくした場合に戻す）
	      ctx.fillStyle = "#fff";
	      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
	      for(var i = 0; i < img_datas_arr.length; i++) ctx.putImageData(img_datas_arr[i], 0, 0);
    });
*/

    // when mouse down
    window.addEventListener(EVENT.TOUCH_START, function(e) {
	      if (ua != 'other') e = e.touches[0];
      	startX = e.pageX - canvas_x;
      	startY = e.pageY - canvas_y;
      	mousedown = true;
        if (mousedown) draw(e.pageX - canvas_x, e.pageY - canvas_y);
    });

    // when mouse up
    window.addEventListener(EVENT.TOUCH_END, function(e) {
    	  mousedown = false;
	      // 配列に保存しておく
		    img_datas_arr[img_datas_cnt] = ctx.getImageData(0, 0, canvas.width, canvas.height);
    		img_datas_cnt++;
    });

    // when mouse move
    window.addEventListener(EVENT.TOUCH_MOVE, function(e) {
	      if (ua != 'other') e = e.touches[0];
	      if (mousedown) draw(e.pageX - canvas_x, e.pageY - canvas_y);
    });

    // draw to the canvas
    function draw(x, y) {
        var w = document.getElementById('width').value;
        var color = document.getElementById('color').value;
        var r = parseInt(color.substring(1, 3), 16);
        var g = parseInt(color.substring(3, 5), 16);
        var b = parseInt(color.substring(5, 7), 16);
        ctx.lineCap = 'round';
        if (era.className == 'active') {
            ctx.strokeStyle = 'rgb(255,255,255)';
        } else {
            ctx.strokeStyle = 'rgb('+ r + ',' + g + ',' + b + ')';
        }
        ctx.lineWidth = w;

    	  ctx.beginPath();
      	ctx.moveTo(startX, startY);
      	ctx.lineTo(x, y);
      	ctx.closePath();
      	ctx.stroke();
      	startX = x;
      	startY = y;
    }

    // clear button
    document.getElementById('clearButton').addEventListener(EVENT.TOUCH_START, function(e) {
    	  // 要素のイベントをリセットしておく
    	  e.preventDefault();
        ret = confirm('クリアします。\n本当にいいですか？');
        if (ret != true) return false;
        ctx.fillStyle = "#fff";
      	ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      	// 配列も空に
      	img_datas_arr = new Array();
      	img_datas_cnt = 0;
    	  return false;
    });
});

var pen = document.getElementById('pencil');
var era = document.getElementById('eraser');
var width = document.getElementById('width');
var widthV = document.getElementById('width_value');

function changeTool(toolType) {
    if (toolType == 1) {
        ctx.globalCompositeOperation = 'source-over';
        pen.className = 'active';
        era.className = '';
    } else if (toolType == 2) {
        //ctx.globalCompositeOperation = 'destination-out';
        // draw in white
        ctx.globalCompositeOperation = 'source-over';
        pen.className = '';
        era.className = 'active';
    }
}

function dispValue() {
    widthV.innerHTML = width.value;
}
