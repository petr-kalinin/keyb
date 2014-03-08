/*
    This file is part of Keyb, a typing tutor for programming language learning
    
    Copyright (C) 2014 Petr Kalinin, petr@kalinin.nnov.ru
 
    Keyb is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var body;
var text;
var currentDiv;
var startTime = -1;
var wordNum = 0;
var totalWords = 10;
var totalLen = 0;
var totalTime = 0;
var totalOk = 0;
var corrFactor = 60 * 1000;
var used = [];
var samples = [];
var fName = 'pascal_beginners.txt';
var ignoreSpaces = true;

var copyrightText = 
        "<p>Keyb, Copyright (C) 2014 Petr Kalinin</p>" +
        "<p>This program is free software: you can redistribute it and/or modify " +
        "it under the terms of the <a href='http://www.gnu.org/licenses/gpl.html'>GNU General Public License</a> as published by " +
        "the <a href='http://www.fsf.org'>Free Software Foundation</a>, either version 3 of the License, or " +
        "(at your option) any later version.</p>" +
        "<p>Данная программа является свободным ПО. Вы можете распространять и/или модифицировать её " + 
        "в соответствии с <a href='http://www.gnu.org/licenses/gpl.html'>Общей Лицензией GNU</a> " +
        " (GNU General Public License), опубликованной <a href='http://www.fsf.org'>Фондом свободного ПО</a> " +
        "(Free Software Foundation), либо версии 3 Лицензии, либо (по Вашему желанию) любой последующей версии.</p>";


function finish() {
    var s = "Всего строк: " + totalOk + "<br/>" +
            "Общая длина: " + totalLen + "<br/>" +
            "Общее время: " + (totalTime/1000).toFixed(1) + " с<br/>";
    if (totalOk > 0)
        s = s + "Средняя скорость: " + (totalLen / totalTime * corrFactor).toFixed(2) + " символов/мин";
    body.append("<div class='final'>" + s +"</div>");
}

function removeDoubleSpaces(s) {
    var s1 = s[0];
    for (i=1; i<s.length; i++)
        if ((s[i]!=' ') || (s[i-1]!=' '))
            s1 += s[i];
    return s1;
}

function isWord(c) {
    return (c=='_') || ((c>='A')&&(c<='Z')) || ((c>='a')&&(c<='z')) || ((c>='0')&&(c<='9'));
}

function removeSpaces(s) {
    var s1 = '';
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
    var ouf = $( "#input" ).val();
    var ok = (removeSpaces(ouf) == removeSpaces(text));
    if (ok) {
        totalLen += text.length;
        totalTime += time;
        totalOk ++;
    }
    var cls = (ok? "ok" : "fail");
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
    var now = new Date().getTime();
    if (startTime < 0)
        startTime = now;
    var time = now - startTime;
    $( "#time" ).html((time/1000).toFixed(2) + " с");
    ouf = $( "#input" ).val();
    if (time > 0)
        $( "#speed" ).html((ouf.length / time * corrFactor).toFixed(2));
    if (e.keyCode == 13)
        processResult(time);
}

function genText() {
    var nn = 0;
    // the following makes us chose truly random if we have no samples left
    var seli = Math.floor(Math.random()*samples.length); 
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
    $( "body" ).append("<div id='footer'>" + copyrightText + "</div>");
    body = $( "#mainCont" );
    body.append("<div id='spacesDiv'><input type='checkbox' name='ignoreSpaces' id='ignoreSpaces' checked='checked'>Игнорировать незначащие пробелы<br/></div>");
    body.append("<button type='button' value='Начать!' onclick='init()' id='start'>Начать!</button>");
    $( "#start" ).focus();
});