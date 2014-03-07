var body;
var text;
var currentDiv;
var startTime = -1;
var wordNum = 0;
var totalWords = 5;
var totalLen = 0;
var totalTime = 0;
var totalOk = 0;
var corrFactor = 60 * 1000;
var used = [];
var samples = [
  'var i:integer;',
  'a:array[1..100] of integer;',
  'f:text;',
  'ok:boolean;',
  'x:extended;',
  's:string;',
  'record x,y:integer; end;',
  'for i:=1 to n do begin',
  'read(n,m);',
  "write(a,' ',b);",
  'if a mod 2=0 then begin',
  'x:=n div 2 + 1;',
  'for i:=n downto 1 do',
  'if (a=0) and (b=0) then',
  'if (a=0) or (b=0) then',
  'end else begin',
  'while i*i<n do',
  'while true do begin',
  'repeat until false;'
];


function finish() {
    s = "Total samples: " + totalOk + "<br/>" +
            "Total length: " + totalLen + "<br/>" +
            "Total time: " + totalTime + "<br/>";
    if (totalOk > 0)
        s = s + "Average speed: " + (totalLen / totalTime * corrFactor).toFixed(2);
    body.append("<div class='final'>" + s +"</div>");
}

function processResult(time) {
    ouf = $( "#input" ).val();
    ok = (ouf == text);
    if (ok) {
        totalLen += text.length;
        totalTime += time;
        totalOk ++;
    }
    cls = (ok? "ok" : "fail");
    $( "#input" ).replaceWith("<div class='ouf " + cls + "'></div>");
    $( "#current .ouf" ).text(ouf).html();
    $( "#current .ouf" ).innerHtml += "&nbsp;";
    $( "#time" ).removeAttr('id').addClass(cls);
    $( "#speed" ).removeAttr('id').addClass(cls);
    currentDiv.removeAttr('id');
    if (wordNum < totalWords)
        startWord();
    else
        finish();
}

function keypressed(e) {
    // for some reason, 'enter' key from button is duplicated to input field too
    if ((e.keyCode == 13) && (startTime < 0))
        return;
    now = new Date().getTime();
    if (startTime < 0)
        startTime = now;
    time = now - startTime;
    $( "#time" ).html(time);
    ouf = $( "#input" ).val();
    if (time > 0)
        $( "#speed" ).html((ouf.length / time * corrFactor).toFixed(2));
    if (e.keyCode == 13)
        processResult(time);
}

function genText() {
    nn = 0;
    // the following makes us chose truly random if we have no samples left
    seli = Math.floor(Math.random()*samples.length); 
    for (i=0; i<samples.length; i++)
        if (used[i]==0) {
            nn++;
            if (Math.floor(Math.random()*nn)==0)
                seli = i;
        }
    used[seli] = 1; 
    return samples[seli];
}

function startWord() {
    wordNum++;
    startTime = -1;
    text = genText();
    body.append("<div class='run' id='current'></div>");
    currentDiv = $( "#current");
    currentDiv.append("<div class='sample'></div>");
    $( "#current .sample" ).text(text).html();
    currentDiv.append("<input type='text' id='input'></div>");
    $( "#input" ).keyup(keypressed);
    currentDiv.append("<div class='time' id='time'>");
    currentDiv.append("<div class='speed' id='speed'>");
    $( "#input" ).focus();
}

function init() {
    $( "#start" ).remove();
    for (i=0; i<samples.length; i++)
        used.push(0);
    startWord();
}

$( document ).ready(function() {
    $( "body" ).append("<div id='mainCont'/>");
    body = $( "#mainCont" );
    body.append("<button type='button' value='Начать!' onclick='init()' id='start'>Начать!</button>");
    $( "#start" ).focus();
});