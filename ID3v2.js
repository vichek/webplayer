var ID3v2 = function() {
    this.errors = [];
    this.version = 'Unknown';
    this.flags = {
        isUnSynchronisation:false,
        hasExtendedHeader:false,
        isExperimental:false,
        hasFooter:false
    };
    this.size = 0;
    this.frames = {};
};

ID3v2.prototype.readFromFile = function(file, callback) {

    if (!(callback instanceof Function)) {
        callback = function(target) {};
    }
    
    var self = this,

    reader = new FileReader;
    
    reader.onloadend = function(e) {
        if (e.target.readyState == FileReader.DONE) {
           console.log('onloadend ID3v2 ' + e.target.readyState)
            var result = new BinaryBuffer(e.target.result);
            
            if (result.stringAt(0,3).toUpperCase() !== 'ID3') {
                self.errors.push('Ошибка: ID3v2 не найден!');
                callback(self);
                return;
            }

            self.version = '2.' + result.byteAt(3) + '.' + result.byteAt(4);
            self.flags.isUnSynchronisation = result.byteAt(5) & 128 ? true : false;
            self.flags.hasExtendedHeader = result.byteAt(5) & 64 ? true : false;
            self.flags.isExperimental = result.byteAt(5) & 32 ? true : false;
            self.flags.hasFooter = result.byteAt(5) & 16 ? true : false;
            
            self.size = result.intAt(6);
            
            if (self.size<1) {
                self.errors.push('Ошибка: ID3v2 поврежден!');
                callback(self);
                return;
            }
            
            reader.onloadend = function(e) {
                var result = new BinaryBuffer(e.target.result),
                    position = 0;

                if (self.size > result.length) {
                    self.size = result.length;
                }
            
                do {
                    var frame = {};
                    var id = result.stringAt(position, 4);
                    if (id === "") break;
                    if (ID3v2.validFramesIds.indexOf(id) < 0) {
                        self.errors.push('Error: ID3v2 Фрейм не поддерживается (' + id + ')!');
                        position += 10;
                    }
                    else {
                        frame.id = id;
                        frame.size = result.intAt(position + 4);
                        position += 10;
                        
                        frame.value = result.stringAt(position + 1, frame.size);
                        position += frame.size;
                        
                        self.frames[id] = frame;
                    }
                } while (position <= self.size);

                callback(self);
            };
            reader.readAsArrayBuffer(file.slice(10, self.size));
        }
    };
    reader.readAsArrayBuffer(file.slice(0, 10)); 
};

ID3v2.prototype.get = function(id) {
    return this.frames[id]?this.frames[id].value:'';
};

ID3v2.validFramesIds = [
    'AENC',    // Audio encryption
    'APIC',    // Attached picture
    'COMM',    // Comments
    'COMR',    // Commercial frame
    'ENCR',    // Encryption method registration
    'EQUA',    // Equalization
    'ETCO',    // Event timing codes
    'GEOB',    // General encapsulated object
    'GRID',    // Group identification registration
    'IPLS',    // Involved people list
    'LINK',    // Linked information
    'MCDI',    // Music CD identifier
    'MLLT',    // MPEG location lookup table
    'OWNE',    // Ownership frame
    'PRIV',    // Private frame
    'PCNT',    // Play counter
    'POPM',    // Popularimeter
    'POSS',    // Position synchronisation frame
    'RBUF',    // Recommended buffer size
    'RVAD',    // Relative volume adjustment
    'RVRB',    // Reverb
    'SYLT',    // Synchronized lyric/text
    'SYTC',    // Synchronized tempo codes
    'TALB',    // Album/Movie/Show title
    'TBPM',    // BPM (beats per minute)
    'TCOM',    // Composer
    'TCON',    // Content type
    'TCOP',    // Copyright message
    'TDAT',    // Date
    'TDLY',    // Playlist delay
    'TENC',    // Encoded by
    'TEXT',    // Lyricist/Text writer
    'TFLT',    // File type
    'TIME',    // Time
    'TIT1',    // Content group description
    'TIT2',    // Title/songname/content description
    'TIT3',    // Subtitle/Description refinement
    'TKEY',    // Initial key
    'TLAN',    // Language(s)
    'TLEN',    // Length
    'TMED',    // Media type
    'TOAL',    // Original album/movie/show title
    'TOFN',    // Original filename
    'TOLY',    // Original lyricist(s)/text writer(s)
    'TOPE',    // Original artist(s)/performer(s)
    'TORY',    // Original release year
    'TOWN',    // File owner/licensee
    'TPE1',    // Lead performer(s)/Soloist(s)
    'TPE2',    // Band/orchestra/accompaniment
    'TPE3',    // Conductor/performer refinement
    'TPE4',    // Interpreted, remixed, or otherwise modified by
    'TPOS',    // Part of a set
    'TPUB',    // Publisher
    'TRCK',    // Track number/Position in set
    'TRDA',    // Recording dates
    'TRSN',    // Internet radio station name
    'TRSO',    // Internet radio station owner
    'TSIZ',    // Size
    'TSRC',    // ISRC (international standard recording code)
    'TSSE',    // Software/Hardware and settings used for encoding
    'TYER',    // Year
    'TXXX',    // User defined text information frame
    'UFID',    // Unique file identifier
    'USER',    // Terms of use
    'USLT',    // Unsychronized lyric/text transcription
    'WCOM',    // Commercial information
    'WCOP',    // Copyright/Legal information
    'WOAF',    // Official audio file webpage
    'WOAR',    // Official artist/performer webpage
    'WOAS',    // Official audio source webpage
    'WORS',    // Official internet radio station homepage
    'WPAY',    // Payment
    'WPUB',    // Publishers official webpage
    'WXXX',    // User defined URL link frame
    
    "TDRC"    // Unknown, possibly year !!!
];
