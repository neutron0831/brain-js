// Read images as array
async function readImages(file) {
  const response = await fetch(`./src/${file}.idx3-ubyte`);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const dataView = new DataView(arrayBuffer);
  // magic number
  const magicNumber = dataView.getInt32(0);
  // number of images
  const images = dataView.getInt32(4);
  // number of rows
  const rows = dataView.getInt32(8);
  // number of columns
  const columns = dataView.getInt32(12);
  const dataArray = new Array(images);
  let offset = 16;
  for (let i = 0; i < images; i++) {
    dataArray[i] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        dataArray[i].push(dataView.getUint8(offset++) < 128 ? 0 : 1);
      }
    }
  }
  return dataArray;
}

// Read labels as array
async function readLabels(file) {
  const response = await fetch(`./src/${file}.idx1-ubyte`);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const dataView = new DataView(arrayBuffer);
  // magic number
  const magicNumber = dataView.getInt32(0);
  // number of images
  const images = dataView.getInt32(4);
  const dataArray = new Array(images);
  let offset = 8;
  for (let i = 0; i < images; i++) {
    dataArray[i] = dataView.getUint8(offset++);
  }
  return dataArray;
}

// Draw an image on Canvas
function drawImage(image) {
  const canvas = document.getElementById('letter');
  const context = canvas.getContext('2d');
  const imageData = context.createImageData(canvas.width, canvas.height);
  for (let row = 0; row < imageData.height; row++) {
    for (let column = 0; column < imageData.width; column++) {
      const offset = imageData.width * row + column;
      imageData.data[offset * 4 + 0] = image[offset] ? 255 : 0; // R value
      imageData.data[offset * 4 + 1] = image[offset] ? 255 : 0; // G value
      imageData.data[offset * 4 + 2] = image[offset] ? 255 : 0; // B value
      imageData.data[offset * 4 + 3] = 255; // A value
    }
  }
  context.putImageData(imageData, 0, 0);
}

// train Neural Network
/*Promise.all([readImages('train-images'), readLabels('train-labels')]).then(([trainingImages, trainingLabels]) => {
    // number of images to train (max: 60,000)
    const n = 60000;
    // create training dataset
    const MNIST = [];
    trainingImages.slice(0,n).forEach((image, i) => MNIST.push({
        input: image,
        output: {
            [trainingLabels[i]]: 1
        }
    }));
    // train the network
    const net = new brain.NeuralNetwork();
    net.trainAsync(MNIST, {
            log: detail => console.log(detail)
        })
        .then(() => {
            // save the network as json
            const a = document.createElement("a");
            a.href = `data:text/plain,${encodeURIComponent(JSON.stringify(net.toJSON()))}`;
            a.download = `${n}.json`;
            a.click();
        });
});*/

// these values are calculated by the following test procedure
let accuracy = [
  [972, 1, 1, 1, 0, 1, 1, 1, 2, 0],
  [0, 1126, 2, 2, 0, 2, 2, 0, 1, 0],
  [9, 2, 1001, 5, 1, 0, 1, 6, 7, 0],
  [1, 1, 4, 984, 1, 9, 0, 3, 5, 2],
  [2, 0, 2, 0, 954, 0, 4, 1, 2, 17],
  [4, 2, 1, 7, 1, 862, 6, 1, 7, 1],
  [9, 4, 0, 0, 6, 6, 929, 0, 4, 0],
  [3, 9, 12, 4, 2, 0, 1, 979, 3, 15],
  [5, 2, 2, 14, 4, 8, 3, 4, 929, 3],
  [5, 6, 0, 6, 7, 7, 2, 4, 3, 969]
];

// test Neural Network
/*Promise.all([readImages('t10k-images'), readLabels('t10k-labels')]).then(async([testImages, testLabels]) => {
    // load the network from json
    const net = new brain.NeuralNetwork();
    const response = await fetch('./src/60000.json');
    const json = await response.json();
    net.fromJSON(json);
    accuracy = Array.from(Array(10), () => Array(10).fill(0));
    // test the network with training images
    for (let i = 0; i < testImages.length; i++) {
        const test = testImages[i];
        const result = Number(brain.likely(test, net));
        accuracy[testLabels[i]][result]++;
    }
});*/

// draw the accuracy bar chart
const colors = ['#F2003C', '#E77F24', '#EFCC00', '#99C33B', '#00A877', '#12AEA6', '#0093AF', '#267AC0', '#87479A', '#CF4D81'];
new Chart(document.getElementById('accuracy').getContext('2d'), {
  type: 'bar',
  data: {
    labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    datasets: [{
      label: 'accuracy',
      data: accuracy.map((A, i) => A[i] * 100 / A.reduce((subset_sum, n) => subset_sum + n, 0)),
      backgroundColor: colors,
      borderColor: colors,
      borderWidth: 1
    }]
  },
  options: {
    scales: {
      y: {
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  }
});

// draw the accuracy diagram
const rgb = [
  [242, 0, 60],
  [231, 127, 36],
  [239, 204, 0],
  [153, 195, 59],
  [0, 168, 119],
  [18, 174, 166],
  [0, 147, 175],
  [38, 122, 192],
  [135, 71, 154],
  [207, 77, 129]
];
const table = document.querySelector('table');
accuracy.forEach((A, i) => {
  const tr = document.createElement('tr');
  table.appendChild(tr);
  if (i === 0) {
    const td = document.createElement('td');
    tr.appendChild(td);
    td.rowSpan = 10;
    td.style.writingMode = 'vertical-lr';
    td.innerHTML = 'どの数字が書かれていたか';
  }
  const sum = A.reduce((subset_sum, n) => subset_sum + n, 0);
  A.forEach((a, j) => {
    const td = document.createElement('td');
    tr.appendChild(td);
    td.style.backgroundColor = `rgb(${rgb[i][0]},${rgb[i][1]},${rgb[i][2]},${a * 50 / sum})`;
    td.innerHTML = j;
  });
});
const tr = document.createElement('tr');
table.appendChild(tr);
for (let i = 0; i < 2; i++) {
  const td = document.createElement('td');
  tr.appendChild(td);
  if (i === 1) {
    td.colSpan = 10;
    td.innerHTML = 'どの数字として識別されたか';
  }
}

// load trained Neural Network from json
const net = new brain.NeuralNetwork();
const response = (async () => await fetch('./src/60000.json'))();
const json = (async () => (await response).json())();
(async () => net.fromJSON(await json))();

// the canvas where the handwriting lette is written
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
// a variable to store the state of the mouse event (moudown: 1, mousemove: 2)
let clickFlg = 0;

// set background color of the canvas
setBgColor();

// define mouse events on the canvas
canvas.onmousedown = canvas.ontouchstart = () => {
  clickFlg = 1;
  window.addEventListener('touchmove', preventDefault, { passive: false });
};
canvas.onmouseup = canvas.ontouchend = async () => {
  clickFlg = 0;
  const dataView = ctx.getImageData(0, 0, 280, 280).data;
  const letter = Array(784).fill(0);
  for (let i = 0; i < 313600; i += 4) {
    const r = Math.floor(i / 11200);
    const c = Math.floor((i % 1120) / 40);
    if (dataView[i] === 0) {
      letter[28 * r + c] = 1;
    }
  }
  drawImage(letter);
  document.getElementById('recognition').innerHTML = `“${brain.likely(letter, net)}”`;
  window.removeEventListener('touchmove', preventDefault, { passive: false });
};
canvas.onmousemove = canvas.ontouchmove = e => {
  if (!clickFlg) return false;
  let x, y;
  if (e.type === 'mousemove') {
    [x, y] = [e.offsetX, e.offsetY];
  } else {
    const rect = e.target.getBoundingClientRect();
    const offsetX = (e.touches[0].clientX - window.pageXOffset - rect.left);
    const offsetY = (e.touches[0].clientY - window.pageYOffset - rect.top);
    [x, y] = [offsetX, offsetY];
  }
  draw(x, y);
};

// prevent scrolling while drawing
function preventDefault(e) {
  e.preventDefault();
}

// drawing process
function draw(x, y) {
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'black';
  if (clickFlg === 1) {
    clickFlg = 2;
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.moveTo(x, y);
  } else {
    ctx.lineTo(x, y);
  }
  ctx.stroke();
};

// clear the canvas
document.querySelector("#clear").onclick = () => {
  ctx.clearRect(0, 0, 280, 280);
  setBgColor();
  document.getElementById('letter').getContext('2d').clearRect(0, 0, 28, 28);
  document.getElementById('recognition').innerHTML = '“&ensp;”';
};

// set background color of the canvas
function setBgColor() {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 280, 280);
  ctx.beginPath();

  ctx.rect(56, 56, 168, 168);
  ctx.strokeStyle = "black";
  ctx.lineWidth = 0.1;
  ctx.stroke();
}
