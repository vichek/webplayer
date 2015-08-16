var BinaryBuffer = function(buffer) {
    this.buffer = new DataView(buffer);
    this.length = buffer.byteLength;
    this.current = 0;
};

BinaryBuffer.prototype = {

    byteAt:function(i){
        this.current = i + 1;
        return this.buffer.getUint8(i)&0xFF;
    },

    charAt:function(i){
        var code=this.byteAt(i);
        if(code==0)return null;
        if(code<32)return "?";
        return String.fromCharCode(code);
    },

    stringAt:function(offset,length){
        var str=[];
        for(var i=offset,j=0;i<offset+length;i++,j++) {
            var value = this.charAt(i);
            if (value == null) {
                break;
            }
            str[j] = value;
        }
        return str.join("");
    },

    intAt:function(i) {
        this.current = i + 4;
        return this.buffer.getUint32(i);
    },

    tell:function() {
        return this.current;
    },

    toString:function(){
        this.current = this.length;
        return this.stringAt(0,this.length);
    }
};
