var Log = require('log'),
    log = new Log('info'),
    clc = require('cli-color');

var cluster = require('cluster');

if (cluster.isMaster) {
    cluster.fork();

    cluster.on('exit', function(worker, code, signal) {
        if (code === 0) {
            log.error('Worker ' + worker.id + ' died..');
            cluster.fork();
        } else {
            log.error('Worker ' + worker.id + ' terminated..');
        }
    });
} else {

    var IbusInterface = require('ibus').IbusInterface;
    var IbusDevices = require('ibus').IbusDevices;

    var CDChangerDevice = require('./devices/CDChangerDevice.js')
    var MK4ToMk3CDTextDevice = require('./devices/MK4ToMk3CDTextDevice.js');
    var GraphicsNavigationOutputDevice = require('./devices/GraphicsNavigationOutputDevice.js');
    var IbusDebuggerDevice = require('./devices/IbusDebuggerDevice.js');

    //var PibusHw4Handler = require('./adapters/PibusHw4Handler.js');

    var MpdClient = require('./clients/MpdClient.js');
    var XbmcClient = require('./clients/XbmcClient.js');
    var KeyboardEventListener = require('./listeners/KeyboardEventListener.js');
    var IbusEventClient = require('./listeners/IbusEventListener.js');

    // config
    //var device = '/dev/pts/2';
    //var device = '/dev/ttys003';
    var device = '/dev/serial0';
    //var device = '/dev/cu.usbserial-A601HPGR';


    // IBUS communication interface
    var ibusInterface = new IbusInterface(device);

    // Keyboard Client
    var keyboardEventListener = new KeyboardEventListener();

    // Ibus Event Client
    var ibusEventClient = new IbusEventClient();

    // Ibus debugger
    var ibusDebuggerDevice = new IbusDebuggerDevice();

    // CD Changer Device
    var cdChangerDevice = new CDChangerDevice(ibusInterface);

    // Graphics Navidagtion Device pirate
    //var navOutput = new GraphicsNavigationOutputDevice(ibusInterface);

    // Display Mk4 CD-text as Mk3 Options
    //var mkTextBridge = new MK4ToMk3CDTextDevice(ibusInterface, navOutput);


    // events
    process.on('SIGINT', onSignalInt);
    process.on('SIGTERM', onSignalTerm);
    process.on('uncaughtException', onUncaughtException);

    // implementation
    function onSignalInt() {
        shutdown(function() {
            process.exit(1);
        });
    }

    function onSignalTerm() {
        log.info('Hard exiting..');
        process.exit(1);
    }

    var isShuttingDown = false;

    function onUncaughtException(err) {

        log.error('[exception-handler] caught: ', err);

        if (isShuttingDown) {
            log.info('[exception-handler] Waiting for previous restart..');
            return;
        }

        log.info('[exception-handler] Exiting app in 5 seconds...');

        // is shutting down but still capturing the errors
        isShuttingDown = true;

        // restart app
        setTimeout(function() {
            shutdown(function() {
                log.info('[exception-handler] Shutdown success..');
                process.exit();
            });
        }, 5000);
    }

    function startup(successFn) {
        // init ibus serial interface
        ibusInterface.startup();

        // ibus debugger
        //ibusDebuggerDevice.init(ibusInterface, []);

        cdChangerDevice.init(ibusInterface);

        // init ibus event client
        ibusEventClient.init(ibusInterface, cdChangerDevice);
    }

    function shutdown(successFn) {
        ibusInterface.shutdown(function() {
            successFn();
        });
    }

    // main start
    startup();
}
