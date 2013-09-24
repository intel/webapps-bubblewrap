/*
 * Copyright (c) 2012, Intel Corporation.
 *
 * This program is licensed under the terms and conditions of the 
 * Apache License, version 2.0.  The full text of the Apache License is at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 */

App = {};

(function () {
    var infocus = true;
    var audioEnabled = true;
    var arcadeMode = false;
    var currentScore = 0;
    var clockInterval = null;
    var secondsLeft;
    var paused = false;
    var gameOver = true;
    var leaders = [];
    var fullBubbleImages = [
        "url('images/Bubblewrap_BubbleFull_122111_a.png')",
        "url('images/Bubblewrap_BubbleFull2_122111_a.png')"
    ];
    var poppedBubbleImages = [
        "url('images/Bubblewrap_BubblePopped_122111_a.png')",
        "url('images/Bubblewrap_BubblePopped2_122111_a.png')",
        "url('images/Bubblewrap_BubblePopped2_122111_a.png')"
    ];

    function startPlaying(arcade) {
        $('.view, .info-view, .gameover-view, .pause-view').addClass('hidden');
        arcadeMode = arcade;
        if (arcade) {
            currentScore = 0;
            secondsLeft = 90;
            $('#saveGameButton').removeClass('checkbox-on');
            $('#clockLabel').text(':' + secondsLeft);
            $('#currentScoreValue').text(0);
            $('#playView, .arcade-view').removeClass('hidden');
            $('#bestScoreValue').text(leaders.length > 0 ? leaders[0].score : 0);
            clockInterval = setInterval(tick, 1000);
        } else {
            $('#playView, .normal-view').removeClass('hidden');
        }

        slideInNewSheet();
    }

    function blink(target) {
        $(target).css('opacity', '0.0');
        setTimeout(function () {
            $(target).css('opacity', '0.6');
        }, 100);
    }

    function addButtonAction(target, action, timeout) {
        $(target).addClass(action);
        
        // setup increasing blinks as the timeout approaches
        setTimeout(function () { blink(target); }, timeout * 0.5);
        setTimeout(function () { blink(target); }, timeout * 0.75);
        setTimeout(function () { blink(target); }, timeout * 0.875);
        setTimeout(function () { blink(target); }, timeout * 0.9375);
        
        // Clear the action
        setTimeout(function () {
            $(target).removeClass('bomb clock pump hammer');
        }, timeout);
    }

    function tick() {
        $('#clockLabel').text(':' + --secondsLeft);
        
        if ((currentScore < 50 && secondsLeft % 3 == 0) || (currentScore > 49 && currentScore < 100 && secondsLeft % 2) || currentScore > 99 ) {
            var actions = ['bomb', 'clock', 'pump', 'hammer'];
            var targetAction = actions[Math.floor(Math.random() * actions.length)];
            var unpoppedBubbles;
            var sheet0 = $('#bubbleSheet0');
            var sheet1 = $('#bubbleSheet1');
            var timeout = currentScore < 50 ? 5000 : (currentScore < 100 ? 2000 : 1000);

            if (sheet0.position().left == 0) {
                unpoppedBubbles = $('#bubbleSheet0 div.bubble:not(.popped) > div.bubble-overlay:not(.bomb, .clock, .pump, .hammer)');
            } else {
                unpoppedBubbles = $('#bubbleSheet1 div.bubble:not(.popped) > div.bubble-overlay:not(.bomb, .clock, .pump, .hammer)');
            }

            addButtonAction(unpoppedBubbles[Math.floor(Math.random() * unpoppedBubbles.length)], targetAction, timeout);

            if (audioEnabled && infocus) {
                if (targetAction == 'bomb' || targetAction == 'pump')
                    new Audio("sounds/BubbleBad.ogg").play();
                else
                    new Audio("sounds/BubbleGood.ogg").play();
            }
        }
        if (secondsLeft < 0) {
            // game over
            gameOver = true;
            clearInterval(clockInterval);
            $('.bubble-overlay').removeClass('bomb clock pump hammer');
            $('.normal-view, .arcade-view').addClass('hidden');
            $('#gameover-score').text(currentScore);
            updateGameOverView(currentScore);
            $('.gameover-view').removeClass('hidden');
            updateLeaderBoards();
            $('#gameover-entry').attr('value', '').removeAttr('disabled').focus();

            if (audioEnabled && infocus) new Audio("sounds/LosingSoundBuzzer.ogg").play();
        }
    }

    function slideInNewSheet() {
        var sheet0 = $('#bubbleSheet0');
        var sheet1 = $('#bubbleSheet1');
        paused = false;
        gameOver = false;

        if (sheet0.position().left > 0 && sheet1.position().left > 0) {
            initializeBubbleSheet(0);
            sheet0.addClass('current-sheet').animate({left: '0px'}, 250);
        } else if (sheet0.position().left > 0) {
            initializeBubbleSheet(0);
            sheet0.addClass('current-sheet').animate({left: '0px'}, 250);
            sheet1.removeClass('current-sheet').animate({left: '-1024px'}, 250, function () {
                sheet1.css('left', '1024px');
            });
        } else {
            initializeBubbleSheet(1);
            sheet1.addClass('current-sheet').animate({left: '0px'}, 250);
            sheet0.removeClass('current-sheet').animate({left: '-1024px'}, 250, function () {
                sheet0.css('left', '1024px');
            });
        }

        if (audioEnabled && infocus)
            new Audio("sounds/NewBubblePage.ogg").play();
    }

    function pauseGamePlay() {
        if (audioEnabled && infocus) new Audio("sounds/ButtonClick.ogg").play();
        paused = true;
        clearInterval(clockInterval);
        $('.arcade-view, .normal-view, .info-view').addClass('hidden');
        $('.pause-view').removeClass('hidden');
        $('#playView').addClass('pause-mode');
    }
    
    function resumeGamePlay() {
        if (audioEnabled && infocus) new Audio("sounds/ButtonClick.ogg").play();
        paused = false;
        if (arcadeMode) {
            clockInterval = setInterval(tick, 1000);
            $('.arcade-view, .normal-view').removeClass('hidden');
        } else {
            $('.normal-view').removeClass('hidden');
        }
        $('.pause-view').addClass('hidden');
        $('#playView').removeClass('pause-mode');
    }

    function updateLeaderBoards() {
        for (var i = 0; i < 7; i++) {
            if (!leaders[i])
                return;
            $('.leader' + i + 'Name').text(leaders[i].name);
            $('.leader' + i + 'Score').text(leaders[i].score);
        }
    }

    function updateGameOverView(score) {
        var foundSpot = false;
        var len = leaders.length;
        if (len > 7)
            len = 7;
        var i;
        for (i = 0; i < len; i ++) {
            if (score > leaders[i].score)
               foundSpot = true;
        }
        if (!foundSpot && i > 6) {
            $('#gameover-entry-container').addClass('hidden');
        }
        else {
            $('#gameover-entry-container').removeClass('hidden');
        }
    }

    function initializeBubbleSheet(index) {
        $('#bubbleSheet' + index + ' .bubble').each(function () {
            $(this).css('background-image', fullBubbleImages[Math.floor(Math.random() * fullBubbleImages.length)])
                .removeClass('popped')
                .children().removeClass('bomb clock pump hammer');;
        });
    }

    function popBubble() {
        if (paused || gameOver)
            return;

        var bubble = $(this);
        if ($(bubble).hasClass('popped')) {
            $('#currentScoreValue').text(--currentScore);
        } else {
            if ($(this).children().hasClass('bomb')) {
                if (audioEnabled && infocus) new Audio("sounds/LosingSound.ogg").play();
                secondsLeft -= 5;
                $('#clockLabel').text(':' + secondsLeft);
            } else if ($(this).children().hasClass('clock')) {
                if (audioEnabled && infocus) new Audio("sounds/Bubble.ogg").play();
                secondsLeft += 5;
                $('#clockLabel').text(':' + secondsLeft);
            } else if ($(this).children().hasClass('pump')) {
                if (audioEnabled && infocus) new Audio("sounds/LosingSound.ogg").play();
                $(this).parent().parent().children().children().each(function () {
                    if ($(this).hasClass('popped') && 
                        Math.abs($(this).position().top - $(bubble).position().top) < 100 && 
                        Math.abs($(this).position().left - $(bubble).position().left) < 100) {
                        currentScore--;
                        $(this).css('background-image', fullBubbleImages[Math.floor(Math.random() * fullBubbleImages.length)])
                            .removeClass('popped')
                            .children().removeClass('bomb clock pump hammer');

                    }
                });
            } else if ($(this).children().hasClass('hammer')) {
                if (audioEnabled && infocus) new Audio("sounds/BubblePop.ogg").play();
                $(this).parent().parent().children().children().each(function () {
                    if ($(this).hasClass('bubble') && 
                        !$(this).hasClass('popped') && 
                        Math.abs($(this).position().top - $(bubble).position().top) < 100 && 
                        Math.abs($(this).position().left - $(bubble).position().left) < 100) {
                        currentScore++;
                        $(this).css('background-image', poppedBubbleImages[Math.floor(Math.random() * poppedBubbleImages.length)])
                            .addClass('popped')
                            .children().removeClass('bomb clock pump hammer');
                    }
                });
            } else {
                if (audioEnabled && infocus) new Audio("sounds/Bubble.ogg").play();
            }
            $('#currentScoreValue').text(++currentScore);
            $(this).addClass('popped').css('background-image', poppedBubbleImages[Math.floor(Math.random() * poppedBubbleImages.length)])
                .children().removeClass('bomb clock pump hammer');
            if ($('.current-sheet .bubble:not(.popped)').length == 0) {
            	if(secondsLeft > 0){
            		if (audioEnabled && infocus) new Audio("sounds/WinningSound.ogg").play();
            	}
                slideInNewSheet();
            }
        }

    }

    function saveGameEntry() {
        var name = $('#gameover-entry').val();
        if (name) {
            $('#saveGameButton').addClass('checkbox-on');
            if (leaders.length == 0) {
                leaders.push({'name': name, 'score': currentScore});
            } else {
                var foundSpot = false;
                for (var i = 0; i < 7 && i < leaders.length; i++) {
                    if (currentScore > leaders[i].score) {
                        leaders.splice(i, 0, {'name': name, 'score': currentScore});
                        foundSpot = true;
                        break;
                    }
                }
                
                if (!foundSpot && leaders.length < 7)
                    // the current score is lower then all existing entries
                    leaders.push({'name': name, 'score': currentScore});
            }
            $(event.target).attr('disabled', true);

            localStorage.leaders = JSON.stringify(leaders);
            updateLeaderBoards();
        }
    }

    function start() {
        $('.view, .arcade-view, .normal-view, .info-view, .gameover-view, .pause-view').addClass('hidden');
        $('#titleView').removeClass('hidden');
        
        if (audioEnabled && infocus) new Audio("sounds/StartGame.ogg").play();
    }

    function init() {
        license_init("license", "titleView");
        $('#app-content').css('height', ($(window).height() - 100) + 'px');

        // load the persisted leaders
        if (localStorage.leaders) {
            leaders = JSON.parse(localStorage.leaders);
        }

        // Setup title view button handlers
        $('#normalButton').click(function () {
            if (audioEnabled && infocus) new Audio("sounds/ButtonClick.ogg").play();
            startPlaying(false);
        });
        $('#arcadeButton').click(function () {
            if (audioEnabled && infocus) new Audio("sounds/ButtonClick.ogg").play();
            startPlaying(true);
        });

        // Setup info button handlers in all views
        var lastView = null;
        $('.info-icon').click(function () {
            if (audioEnabled && infocus) new Audio("sounds/ButtonClick.ogg").play();
            lastView = $('.view:not(.hidden)');
            updateLeaderBoards();
            $('.view, .normal-view, .arcade-view, .gameover-view, .pause-view').addClass('hidden');
            $('#playView, .info-view').removeClass('hidden pause-mode');
        });
        $('.close-button').click(function () {
            if (audioEnabled && infocus) new Audio("sounds/ButtonClick.ogg").play();
            if (lastView.attr('id') == 'titleView') {
                start();
            } else {
                $('.info-view').addClass('hidden');
                $('.pause-view').removeClass('hidden');
                $('#playView').addClass('pause-mode');
            }
        });

        // Setup play view button handlers
        $('#pauseButton').click(pauseGamePlay);
        $('.bubble').click(popBubble);

        // Setup pause view button handlers
        $('#quitButton').click(function () {
            $('#playView').removeClass('pause-mode');
            start();
        });
        $('#resumeButton').click(resumeGamePlay);

        // Setup info view handlers
        $('#settingsPage').click(function () {
            if (audioEnabled && infocus) new Audio("sounds/NavChangePaper.ogg").play();
            $('#helpPage').removeClass('ontop');
        });
        $('#helpPage').click(function () {
            if (audioEnabled && infocus) new Audio("sounds/NavChangePaper.ogg").play();
            $('#helpPage').addClass('ontop');
        });
        $('#audioSettingOn').click(function () {
            audioEnabled = true;
            $('#audioSettingOn').addClass('checkbox-on');
            $('#audioSettingOff').removeClass('checkbox-on');
        });
        $('#audioSettingOff').click(function () {
            audioEnabled = false;
            $('#audioSettingOff').addClass('checkbox-on');
            $('#audioSettingOn').removeClass('checkbox-on');
        });

        // Setup gameover view handlers
        $('#homeButton').click(start);
        $('#playAgainButton').click(function () {
            startPlaying(true);
        });
        $('#saveGameButton').click(saveGameEntry);

        start();
    }

    $(document).ready(function () {
        init();
        window.onblur = function() {infocus = false;};
        window.onfocus = function() {infocus = true;};
    });
})()
