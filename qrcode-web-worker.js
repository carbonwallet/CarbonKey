self.addEventListener('message', function(e) {
    const input = e.data;

    switch (input.cmd) {
        case 'init':
            init();
            break;
        case 'process':
            var result = process(input);
            self.postMessage(result);
            break;
        default:
            console.log('Unknown command for worker.');
            break;
    }
});

function init() {
    console.log('Importing QR code files.');
    self.importScripts(
        'js/jsqrcode/grid.js',
        'js/jsqrcode/version.js',
        'js/jsqrcode/detector.js',
        'js/jsqrcode/formatinf.js',
        'js/jsqrcode/errorlevel.js',
        'js/jsqrcode/bitmat.js',
        'js/jsqrcode/datablock.js',
        'js/jsqrcode/bmparser.js',
        'js/jsqrcode/datamask.js',
        'js/jsqrcode/rsdecoder.js',
        'js/jsqrcode/gf256poly.js',
        'js/jsqrcode/gf256.js',
        'js/jsqrcode/decoder.js',
        'js/jsqrcode/qrcode.js',
        'js/jsqrcode/findpat.js',
        'js/jsqrcode/alignpat.js',
        'js/jsqrcode/databr.js'
    );
}

function process(input) {
    qrcode.width = input.width;
    qrcode.height = input.height;
    qrcode.imagedata = input.imageData;

    let result = { result: false, error: '' }
    try {
        result.result = qrcode.process();
        console.log(result.result);

    } catch (e) { 
      console.log(e);
      result.error = e 
    }


    return result;
}