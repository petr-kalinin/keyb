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
var samples = [];
var fName = 'pascal_beginners.txt';
var ignoreSpaces = true;

function finish() {
    s = "Total samples: " + totalOk + "<br/>" +
            "Total length: " + totalLen + "<br/>" +
            "Total time: " + totalTime + "<br/>";
    if (totalOk > 0)
        s = s + "Average speed: " + (totalLen / totalTime * corrFactor).toFixed(2);
    body.append("<div class='final'>" + s +"</div>");
}

function removeDoubleSpaces(s) {
    s1 = s[0];
    for (i=1; i<s.length; i++)
        if ((s[i]!=' ') || (s[i-1]!=' '))
            s1 += s[i];
    return s1;
}

function isWord(c) {
    return (c=='_') || ((c>='A')&&(c<='Z')) || ((c>='a')&&(c<='z')) || ((c>='0')&&(c<='9'));
}

function removeSpaces(s) {
    s1 = '';
    if ( ignoreSpaces ) {
        s1 = '';
        s = removeDoubleSpaces(s);
        for (i=0; i<s.length; i++) {
            if (s[i] == ' ') {
                if (i==0) continue;
                if (i==s.length-1) continue;
                // we consider a space to be important iff it is surrounded by word characters
                // or by non-word characters
                if (isWord(s[i-1]) != isWord(s[i+1])) continue;
            }
            s1 += s[i];
        }
    } else s1 = s;
    return s1;
}

function processResult(time) {
    ouf = $( "#input" ).val();
    ok = (removeSpaces(ouf) == removeSpaces(text));
    if (ok) {
        totalLen += text.length;
        totalTime += time;
        totalOk ++;
    }
    cls = (ok? "ok" : "fail");
    $( "#input" ).replaceWith("<div class='ouf " + cls + "'></div>");
    $( "#current .ouf" ).text(ouf).html();
    $( "#current .ouf" ).innerHtml += " ";
    $( "#current .ouf" ).wrapInner("<pre class='sample'/>");
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
    $( "#current .sample" ).wrapInner("<pre class='sample'/>");
    currentDiv.append("<input type='text' id='input'></div>");
    $( "#input" ).keyup(keypressed);
    currentDiv.append("<div class='time' id='time'>");
    currentDiv.append("<div class='speed' id='speed'>");
    $( "#input" ).focus();
}

function loadDict(callback) {
    $.when(
        $.get(fName, function(data) {
            samples = data.split("\n");
        })
    ).done( function(x) {
        for (i=0; i<samples.length; i++)
            used.push(0);
        callback();
    } );
}

function init() {
    $( "#start" ).remove();
    ignoreSpaces = $( "#ignoreSpaces" ).prop("checked");
    $( "#ignoreSpaces" ).attr("disabled", "disabled");
    loadDict(startWord);
}

$( document ).ready(function() {
    $( "body" ).append("<div id='mainCont'/>");
    body = $( "#mainCont" );
    body.append("<div id='spacesDiv'><input type='checkbox' name='ignoreSpaces' id='ignoreSpaces' checked='checked'>Игнорировать незначащие пробелы<br/></div>");
    body.append("<button type='button' value='Начать!' onclick='init()' id='start'>Начать!</button>");
    $( "#start" ).focus();
});