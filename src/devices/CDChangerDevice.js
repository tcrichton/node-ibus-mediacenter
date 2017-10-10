var Log = require('log'),
    log = new Log('info'),
    msgs = require('../messages.js'),
    clc = require('cli-color');

var CDChangerDevice = function (ibusInterface) {

    // self reference
    var _self = this;
    var announceNeeded = true;

    // exposed data
    this.init = init;
    this.deviceName = 'CDChangerDevice';
    this.announceDevice = announceDevice;
    this.respondAsCDplayer = respondAsCDplayer;
    this.sendPlaying0101 = sendPlaying0101;

    // implementation
    function init() {
        _self.announceNeeded=true;
        announceDevice();
    }

    function announceDevice() {
      log.info('[CD Changer] Announcing myself on the bus');
        if (_self.announceNeeded) {
            ibusInterface.sendMessage(msgs.messages.cdc_announceCd);
            setTimeout(function () {
                log.info('[CD Changer] Annoucement check');
                if(_self.announceNeeded){
                    announceDevice();
                }
                    else {
                      log.info('[CD Changer] No Announcement needed');
                    }
            }, 3000);
        }
    }

    function respondAsCDplayer() {
        log.info("[CD Changer->Radio] Hey, I'm here");
        ibusInterface.sendMessage(msgs.messages.cdc_respondAsCd);
        _self.announceNeeded=false;
    }

    function sendPlaying0101(){
        log.info('[CD Changer->Radio] I am playing a CD... honest...');
        ibusInterface.sendMessage(msgs.messages.cdc_playing0101);
    }

};

module.exports = CDChangerDevice;
