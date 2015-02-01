/*
    @licstart
    This file is part of Keyb, a typing tutor for programming language learning

    Copyright (C) 2014 Petr Kalinin, petr@kalinin.nnov.ru

    Keyb is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License <http://www.gnu.org/licenses/gpl.html> for more details.

    The full text of the license is available at <http://www.gnu.org/licenses/gpl.html>
    @licend
*/
// @source: https://github.com/petr-kalinin/keyb

var copyrightText =
        "<p>Keyb, Copyright (C) 2014 Petr Kalinin</p>" +
        "<p>This program is free software: you can redistribute it and/or modify " +
        "it under the terms of the <a href='http://www.gnu.org/licenses/gpl.html'>GNU General Public License</a> as published by " +
        "the <a href='http://www.fsf.org'>Free Software Foundation</a>, either version 3 of the License, or " +
        "(at your option) any later version.</p>" +
        "<p>Данная программа является свободным ПО. Вы можете распространять и/или модифицировать её " +
        "в соответствии с <a href='http://www.gnu.org/licenses/gpl.html'>Общей Лицензией GNU</a> " +
        " (GNU General Public License), опубликованной <a href='http://www.fsf.org'>Фондом свободного ПО</a> " +
        "(Free Software Foundation), либо версии 3 Лицензии, либо (по Вашему желанию) любой последующей версии.</p>" +
        "<p><a href='https://github.com/petr-kalinin/keyb'>https://github.com/petr-kalinin/keyb</a></p>";

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
var cookieKey = "allSpeedResults";
var allAvgNumResults = [];
var used = [];
var samples = [];
var fNames = {
    'pascal_beginners.txt': 'Pascal для начинающих',
    'cpp_beginners.txt': 'C++ для начинающих'
};
var fName = 'pascal_beginners.txt';
//var fName = 'cpp_sample.txt';
var ignoreSpaces = true;

var removeResults = function(){
    if ($.cookie(cookieKey)){
        var cookieObjects = $.cookie(cookieKey).split(",");
        for(var i=0; i<=cookieObjects.length; i++){
            $.removeCookie(cookieObjects[i]);
        }
        $.removeCookie(cookieKey);
    }
    $(".final").remove()
};

var getBestResult = function () {
    return JSON.parse($.cookie(allAvgNumResults.sort(function (a, b) {
        return b - a;
    })[0].toString()));
};

function writeCookie(averageSpeed) {
    allAvgNumResults = $.cookie(cookieKey) ? $.cookie(cookieKey).split(",") : [];
    var totalTimeInSec = (totalTime / 1000).toFixed(1);
    // Assume that 5 correct words are the minimal required for good statistics 
    var averageNum = ((totalOk >= 5) ? (1.0*averageSpeed) : (0.5*averageSpeed)).toFixed(4);
    var items = JSON.stringify({
        averageSpeed: averageSpeed,
        totalLen: totalLen,
        totalOk: totalOk,
        totalTimeInSec: totalTimeInSec,
        averageNum: averageNum
    });
    allAvgNumResults.push(averageNum);
    $.cookie(cookieKey, allAvgNumResults, {expires: 7});
    $.cookie(averageNum.toString(), items, {expires: 7})
}

function finish() {
    var lastResultInfo = "Последний результат: <br/>" +
        "Всего строк: " + totalOk + "<br/>" +
        "Общая длина: " + totalLen + "<br/>" +
        "Общее время: " + (totalTime / 1000).toFixed(1) + " с<br/>";
    if (totalOk > 0) {
        var averageSpeed = (totalLen / totalTime * corrFactor).toFixed(2);
        lastResultInfo = lastResultInfo + "Средняя скорость: " + averageSpeed + " символов/мин" + "<br/>";
        writeCookie(averageSpeed);
    }

    if(allAvgNumResults!=[]){
        var bestResult = getBestResult();
        var bestResultDiv = "Лучший результат: <br/>" +
            "Всего строк: " + bestResult.totalOk + "<br/>" +
            "Общая длина: " + bestResult.totalLen + "<br/>" +
            "Общее время: " + bestResult.totalTimeInSec + " с<br/>" +
            "Средняя скорость: " + bestResult.averageSpeed + " символов/мин" + "<br/>";
    }

    body.append("<div class='final'><div class='last' style='float: left;'>" + lastResultInfo +
    "</div><div class='best' style='float: right'>" + bestResultDiv + "</div></div>");
    body.append("<button type='button' onclick='restart()' id='start'>Повторить</button>");
    body.append("<button type='button' onclick='removeResults()' id='start'>Удалить результаты</button>");
    $( "#start" ).focus();
}

function isWord(c) {
    return (c=='_') || ((c>='A')&&(c<='Z')) || ((c>='a')&&(c<='z')) || ((c>='0')&&(c<='9'));
}

function isCharImportant(s, i) {
    if (s[i] != ' ') return true;
    l = i-1;
    while ((l>=0) && (s[l]==' ')) l--;
    r = i+1;
    while ((r<s.length) && (s[r]==' ')) r++;
    if (l<0) return false;
    if (r>=s.length) return false;
    // we consider a space to be important iff it is surrounded by word characters
    // and of several succesive spaces we consider only the first
    return (isWord(s[l]) && isWord(s[r]) && (l==i-1));
}

function protectHtml(a) {
    if (a=='&') return "&amp;";
    else if (a=='<') return "&lt;";
    else if (a==">") return "&gt;";
    else if (a=='"') return "&quot;";
    else if (a=="'") return "&#039;";
    else return a;
}

function processCompare(a, b) {

    function formatCommonStrings(i, j, aBad, bBad) {
        if ((i==0) && (j==0)) {
            if (aBad) aF = "<pre class='bad'>" + aF;
            else aF = "<pre class='sample'>" + aF;
            if (bBad) bF = "<pre class='bad'>" + bF;
            else bF = "<pre class='sample'>" + bF;
            return;
        }
        if (from[i][j]==1) {
            if (!aBad) aF = "</pre><pre class='sample'>" + aF;
            aF = protectHtml(a[i-1]) + aF;
            formatCommonStrings(i-1, j, true, bBad);
        } else if (from[i][j] == 2) {
            if (!bBad) bF = "</pre><pre class='sample'>" + bF;
            bF = protectHtml(b[j-1]) + bF;
            formatCommonStrings(i, j-1, aBad, true);
        } else if (from[i][j] == 3) {
            if (aBad) aF = "</pre><pre class='bad'>" + aF;
            if (bBad) bF = "</pre><pre class='bad'>" + bF;
            aF = protectHtml(a[i-1]) + aF;
            bF = protectHtml(b[j-1]) + bF;
            formatCommonStrings(i-1, j-1, false, false);
        } else if (from[i][j] == -1) {
            aF = protectHtml(a[i-1]) + aF;
            formatCommonStrings(i-1, j, aBad, bBad);
        } else {
            bF = protectHtml(b[j-1]) + bF;
            formatCommonStrings(i, j-1, aBad, bBad);
        }
    }

    var ans = new Array(a.length + 1);
    var from = new Array(a.length + 1);
    for (var i = 0; i <= a.length; i++) {
        ans[i] = new Array(b.length + 1);
        from[i] = new Array(b.length + 1);
    }
    ans[0][0] = 0;
    for (var i=1; i<=b.length; i++) {
        if (!isCharImportant(b, i-1)) {
            ans[0][i] = ans[0][i-1];
            from[0][i] = -2;
        } else {
            ans[0][i] = ans[0][i-1] + 1;
            from[0][i] = 2;
        }
    }
    for (var i=1; i<=a.length; i++) {
        if (!isCharImportant(a, i-1)) {
            ans[i][0] = ans[i-1][0];
            from[i][0] = -1;
        } else {
            ans[i][0] = ans[i-1][0] + 1;
            from[i][0] = 1;
        }
        for(var j=1; j<=b.length; j++) {
            if (!isCharImportant(a, i-1)) {
                ans[i][j] = ans[i-1][j];
                from[i][j] = -1;
            } else if (!isCharImportant(b, j-1)) {
                ans[i][j] = ans[i][j-1];
                from[i][j] = -2;
            } else if (a[i-1]==b[j-1]) {
                ans[i][j] = ans[i-1][j-1]
                from[i][j] = 3;
            } else if (ans[i-1][j] < ans[i][j-1]) {
                ans[i][j] = ans[i-1][j] + 1;
                from[i][j] = 1;
            } else {
                ans[i][j] = ans[i][j-1] + 1;
                from[i][j] = 2;
            }
        }
    }
    var aF = '</pre>';
    var bF = '</pre>';
    formatCommonStrings(a.length, b.length, false, false);
    return {
        ok : (ans[a.length][b.length] == 0),
        aF : aF,
        bF : bF
    };
}

function processResult(time) {
    var ouf = $( "#input" ).val();
    var res = processCompare(text, ouf);
    var ok = res.ok
    var textF = res.aF
    var oufF = res.bF
    if (ok) {
        totalLen += Math.min(ouf.length, text.length);
        totalTime += time;
        totalOk ++;
    }
    var cls = (ok? "ok" : "fail");
    $( "#input" ).replaceWith("<div class='ouf " + cls + "'></div>");
    $( "#current div.sample" ).html(textF + "&nbsp;");
    $( "#current .ouf" ).html(oufF + "&nbsp;");
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
    if ((e.which == 13) && (startTime < 0))
        return;
    var now = new Date().getTime();
    if (startTime < 0)
        startTime = now;
    var time = now - startTime;
    $( "#time" ).html((time/1000).toFixed(2) + " с");
    ouf = $( "#input" ).val();
    if (time > 0)
        $( "#speed" ).html((ouf.length / time * corrFactor).toFixed(2));
    if (e.which == 13)
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
    currentDiv.append("<input type='text' id='input' onpaste='return false;'></div>");
    $( "#input" ).keyup(keypressed);
    currentDiv.append("<div class='time' id='time'>");
    currentDiv.append("<div class='speed' id='speed'>");
    $( "#input" ).focus();
}

function loadDict(callback) {
    $.when(
        $.get("dictionaries/" + fName, function(data) {
            samples = data.split(/\r?\n/);
        })
    ).done( function(x) {
        for (i=0; i<samples.length; i++)
            used.push(0);
        callback();
    } );
}

function init(e) {
    e.preventDefault();
    $( "#start" ).remove();
    ignoreSpaces = $( "#ignoreSpaces" ).prop("checked");
    totalWords = parseInt( $( "#numWords" ).val() , 10);
    var fNameNew = $("#fName").val();
    if (!(fNameNew in fNames)) {
        restart();
        return;
    }
    fName = fNameNew;
    $( "#ignoreSpaces" ).attr("disabled", "disabled");
    $( "#numWords" ).attr("disabled", "disabled");
    $( "#fName" ).attr("disabled", "disabled");
    loadDict(startWord);
}

function fullInit() {
    $( "body" ).append("<div id='mainCont'/>");
    $( "body" ).append("<div id='footer'>" + copyrightText + "</div>");
    body = $( "#mainCont" );
    body.append("<form/>");
    form = $( "form" );
    form.append("<div id='fNameDiv'>Словарь: <select name='fName' id='fName' /> </div>");
    for(var name in fNames)
        $( "#fName" ).append("<option value='" + name + "'>" + fNames[name] +"</option>");
    $( "#fName option[value='" + fName + "']" ).attr("selected", "selected");
    form.append("<div id='spacesDiv'><input type='checkbox' name='ignoreSpaces' id='ignoreSpaces' "
        + (ignoreSpaces ? "checked='checked' " : "" ) + "/> Игнорировать незначащие пробелы</div>");
    form.append("<div id='numWordsDiv'>Количество строк: <input type='text' name='numWords' id='numWords' checked='checked' value='"+totalWords+"'/></div>");
    form.append("<input type='submit' value='Начать!' onclick='' id='start'/>");
    form.submit(init);
    $( "#start" ).focus();
}

function restart() {
    startTime = -1;
    wordNum = 0;
    totalLen = 0;
    totalTime = 0;
    totalOk = 0;
    used = [];
    $( "#mainCont" ).remove();
    $( "#footer" ).remove();
    fullInit();
}

$( document ).ready(function() {
    fullInit();
});
