var jsPsych =
    initJsPsych({

        on_finish:
            function() {
                // 不显示 jsPsych 原始日志
            }

    });


var subjectId = "";

var currentQ3StartTime = null;


/*
    所有尚未完成的数据库操作
*/

var pendingDatabaseOperations = [];


/* =========================================================
   被试编号
========================================================= */

var idTrial = {

    type:
        jsPsychSurveyText,

    questions: [
        {

            prompt:
                "请输入被试 ID（请询问主试）：",

            name:
                "subject_id",

            required:
                true

        }
    ],

    button_label:
        "开始实验",


    on_finish:
        function(data) {

            subjectId =
                String(
                    data.response.subject_id
                ).trim();


            jsPsych.data.addProperties({

                subject_id:
                    subjectId

            });


            /*
                创建数据库 session。

                不阻塞实验界面。

                后面的上传函数会自动等待
                session 创建完成。
            */

            beadsSessionReadyPromise =
                createBeadsSession(
                    subjectId
                );

        }

};


/* =========================================================
   实验条件
========================================================= */

var trials = [

    {

        trialNum: 1,

        ratio: "80:20",

        seq: [
            "Y","Y","Y","B","Y",
            "Y","Y","Y","B","Y",
            "Y","Y","B","Y","Y",
            "Y","Y","B","Y","Y"
        ],

        jarA: {
            main: "Y",
            mainPct: 80,
            other: "B",
            otherPct: 20
        },

        jarB: {
            main: "B",
            mainPct: 80,
            other: "Y",
            otherPct: 20
        },

        correct:
            "A"

    },


    {

        trialNum: 2,

        ratio: "80:20",

        seq: [
            "B","B","B","Y","B",
            "B","B","B","Y","B",
            "B","B","Y","B","B",
            "B","B","Y","B","B"
        ],

        jarA: {
            main: "Y",
            mainPct: 80,
            other: "B",
            otherPct: 20
        },

        jarB: {
            main: "B",
            mainPct: 80,
            other: "Y",
            otherPct: 20
        },

        correct:
            "B"

    },


    {

        trialNum: 3,

        ratio: "60:40",

        seq: [
            "Y","Y","B","Y","B",
            "B","Y","B","Y","Y",
            "B","Y","Y","B","B",
            "Y","B","Y","Y","B"
        ],

        jarA: {
            main: "Y",
            mainPct: 60,
            other: "B",
            otherPct: 40
        },

        jarB: {
            main: "B",
            mainPct: 60,
            other: "Y",
            otherPct: 40
        },

        correct:
            "A"

    },


    {

        trialNum: 4,

        ratio: "60:40",

        seq: [
            "B","B","Y","B","Y",
            "Y","B","Y","B","B",
            "Y","B","B","Y","Y",
            "B","Y","B","B","Y"
        ],

        jarA: {
            main: "Y",
            mainPct: 60,
            other: "B",
            otherPct: 40
        },

        jarB: {
            main: "B",
            mainPct: 60,
            other: "Y",
            otherPct: 40
        },

        correct:
            "B"

    }

];


var beadColorMap = {

    "Y":
        "bead-yellow",

    "B":
        "bead-blue"

};


var beadNameMap = {

    "Y":
        "黄色",

    "B":
        "蓝色"

};


/* =========================================================
   显示工具
========================================================= */

function getTextColorClass(
    colorCode
) {

    return (
        colorCode === "Y"
            ?
            "text-yellow"
            :
            "text-blue"
    );

}


/*
    使用最初版：

    jar = 170 × 210
    bead = 16 × 16
*/

function generateBeads(
    jar
) {

    var total =
        50;


    var mainCount =
        Math.round(
            jar.mainPct /
            100 *
            total
        );


    var otherCount =
        total -
        mainCount;


    var beadSize =
        16;


    var gap =
        1;


    var step =
        beadSize +
        gap;


    var leftBound =
        4;


    var rightBound =
        170 -
        beadSize -
        4;


    var bottomBound =
        210 -
        beadSize -
        4;


    var beads =
        [];


    var colorPool =
        [];


    for (
        var i = 0;
        i < mainCount;
        i++
    ) {

        colorPool.push(
            jar.main
        );

    }


    for (
        var j = 0;
        j < otherCount;
        j++
    ) {

        colorPool.push(
            jar.other
        );

    }


    colorPool =
        jsPsych.randomization.shuffle(
            colorPool
        );


    var x =
        leftBound;


    var y =
        bottomBound;


    while (
        x <= rightBound &&
        colorPool.length > 0
    ) {

        beads.push({

            color:
                colorPool.pop(),

            x:
                x,

            y:
                y

        });


        x +=
            step;

    }


    var rowOffset =
        0;


    while (
        colorPool.length >
        0
    ) {

        y -=
            step;


        if (
            y < 4
        ) {

            break;

        }


        rowOffset =
            rowOffset === 0
                ?
                step / 2
                :
                0;


        x =
            leftBound +
            rowOffset;


        while (
            x <= rightBound &&
            colorPool.length > 0
        ) {

            var jx =
                Math.max(
                    leftBound,
                    Math.min(
                        rightBound,
                        x +
                        (
                            Math.random() -
                            0.5
                        ) *
                        4
                    )
                );


            var jy =
                Math.max(
                    4,
                    Math.min(
                        bottomBound,
                        y +
                        (
                            Math.random() -
                            0.5
                        ) *
                        3
                    )
                );


            beads.push({

                color:
                    colorPool.pop(),

                x:
                    jx,

                y:
                    jy

            });


            x +=
                step;

        }

    }


    return beads;

}


function renderBeadsHtml(
    beadsArr
) {

    var html =
        "";


    beadsArr.forEach(
        function(b) {

            html +=
                '<div class="jar-bead ' +
                beadColorMap[b.color] +
                '" style="left:' +
                b.x +
                'px; top:' +
                b.y +
                'px;"></div>';

        }
    );


    return html;

}


function renderJarFixed(
    jarObj,
    beadList,
    jarLetter
) {

    var clsMain =
        getTextColorClass(
            jarObj.main
        );


    var clsOther =
        getTextColorClass(
            jarObj.other
        );


    return `

        <div class="jar-wrap">

            <div class="jar-letter">
                ${jarLetter}
            </div>

            <div class="jar-neck">
            </div>

            <div class="jar-body">
                ${renderBeadsHtml(beadList)}
            </div>

            <div class="jar-ratio">

                <span class="${clsMain}">
                    ${jarObj.mainPct}%
                    ${beadNameMap[jarObj.main]}珠子
                </span>

                <br>

                <span class="${clsOther}">
                    ${jarObj.otherPct}%
                    ${beadNameMap[jarObj.other]}珠子
                </span>

            </div>

        </div>
    `;

}


function renderSequence(
    seq
) {

    return seq
        .map(
            function(c) {

                return (
                    '<div class="seq-bead ' +
                    beadColorMap[c] +
                    '"></div>'
                );

            }
        )
        .join("");

}


/* =========================================================
   实验说明
========================================================= */

var instructions = {

    type:
        jsPsychHtmlButtonResponse,

    stimulus: `

        <h2>
            欢迎参加本任务
        </h2>

        <p
            style="
                font-size:18px;
                line-height:1.8;
            "
        >

            你会看到两个罐子，罐子里装着不同比例的两种颜色的珠子。

            <br>

            点击开始抽取后，会随机选中一个罐子，一颗一颗地抽取珠子。

            <br><br>

            每抽一颗珠子后，你需要回答三个问题：

            <br>

            1. 判断这颗珠子最可能来自哪一个罐子

            <br>

            2. 估计珠子来自该罐子的概率（0%-100%）

            <br>

            3. 判断当前信息是否足够做出确定判断

            <br><br>

            如果信息不足，点击“查看下一颗珠子”继续抽取。

            <br>

            已抽过的珠子会显示在屏幕上。

            <br><br>

            本实验共有4个试次，每个试次结束后自动进入下一试次，没有时间限制。

        </p>
    `,

    choices: [
        "开始任务"
    ],

    button_html:
        '<button class="jspsych-btn" style="font-size:20px; padding:15px 40px;">%choice%</button>'

};


/* =========================================================
   Trial
========================================================= */

function buildTrialTimeline(
    trial
) {

    var timeline =
        [];


    var drawnSeq =
        [];


    var currentBeadIdx =
        0;


    var trialFinished =
        false;


    var firstBeadStartTime =
        null;


    var lastRoundQ2Value =
        null;


    /*
        当前 bead 的数据暂存

        Q1 → Q2 → Q3 完成后
        合成一行上传数据库。
    */

    var currentDraw =
        null;


    /*
        当前 trial 最后一颗珠子的上传 Promise。

        Final Decision 必须等它 INSERT 成功后，
        再执行 RPC UPDATE。
    */

    var lastDrawUploadPromise =
        Promise.resolve(true);


    const jarABeads =
        generateBeads(
            trial.jarA
        );


    const jarBBeads =
        generateBeads(
            trial.jarB
        );


    /* =====================================================
       Trial Start
    ===================================================== */

    var trialStart = {

        type:
            jsPsychHtmlButtonResponse,

        stimulus:
            function() {

                return `

                    <div class="task-header">
                        题目数：
                        ${trial.trialNum} / 4
                    </div>

                    <h2 style="text-align:center;">
                        第 ${trial.trialNum} 试次
                        （比例 ${trial.ratio}）
                    </h2>

                    <div class="jar-container">

                        ${renderJarFixed(
                            trial.jarA,
                            jarABeads,
                            "A"
                        )}

                        ${renderJarFixed(
                            trial.jarB,
                            jarBBeads,
                            "B"
                        )}

                    </div>

                    <p
                        style="
                            font-size:18px;
                            text-align:center;
                        "
                    >
                        点击下方按钮，开始本试次抽取珠子
                    </p>
                `;

            },

        choices: [
            "开始抽取"
        ],

        button_html:
            '<button class="jspsych-btn" style="font-size:20px; padding:15px 40px;">%choice%</button>'

    };


    timeline.push(
        trialStart
    );


    /* =====================================================
       Q1
    ===================================================== */

    function makeBeadTrial() {

        return {

            type:
                jsPsychHtmlButtonResponse,


            stimulus:
                function() {

                    if (
                        currentBeadIdx ===
                        0
                    ) {

                        firstBeadStartTime =
                            performance.now();

                    }


                    var beadColor =
                        trial.seq[
                            currentBeadIdx %
                            trial.seq.length
                        ];


                    var beadIndex =
                        currentBeadIdx +
                        1;


                    drawnSeq.push(
                        beadColor
                    );


                    return `

                        <div class="task-header">
                            题目数：
                            ${trial.trialNum} / 4
                        </div>

                        <div class="current-bead-title">
                            珠子${beadIndex}
                        </div>

                        <div class="current-bead-area">

                            <div
                                class="
                                    current-bead
                                    ${beadColorMap[beadColor]}
                                ">
                            </div>

                        </div>

                        <div class="jar-container">

                            ${renderJarFixed(
                                trial.jarA,
                                jarABeads,
                                "A"
                            )}

                            ${renderJarFixed(
                                trial.jarB,
                                jarBBeads,
                                "B"
                            )}

                        </div>

                        <div class="sequence-area">

                            <div class="sequence-label">
                                已抽取序列：
                            </div>

                            <div class="sequence-beads">
                                ${renderSequence(
                                    drawnSeq
                                )}
                            </div>

                        </div>

                        <p class="question-text">
                            问题 1：
                            这颗珠子最可能来自哪一个罐子？
                        </p>
                    `;

                },


            choices: [
                "罐子 A",
                "罐子 B"
            ],


            button_html:
                '<button class="jspsych-btn" style="font-size:20px; padding:15px 35px;">%choice%</button>',


            data:
                function() {

                    return {

                        trial:
                            trial.trialNum,

                        ratio:
                            trial.ratio,

                        bead_index:
                            currentBeadIdx +
                            1,

                        bead_color:
                            trial.seq[
                                currentBeadIdx %
                                trial.seq.length
                            ],

                        question:
                            "Q1_jar",

                        trialTimestamp:
                            new Date()
                                .toISOString()

                    };

                },


            on_finish:
                function(data) {

                    data.q1_response =
                        data.response === 0
                            ?
                            "A"
                            :
                            "B";


                    data.q1_rt =
                        data.rt;


                    /*
                        开始建立这一颗珠子的最终数据行
                    */

                    currentDraw = {

                        subject:
                            subjectId,

                        trial:
                            data.trial,

                        ratio:
                            data.ratio,

                        bead_index:
                            data.bead_index,

                        bead_color:
                            data.bead_color,

                        q1_response:
                            data.q1_response,

                        q1_rt:
                            data.q1_rt,

                        q2_probability:
                            null,

                        q2_rt:
                            null,

                        q3_sufficient:
                            null,

                        q3_rt:
                            null,

                        trialTimestamp:
                            data.trialTimestamp

                    };

                }

        };

    }


    /* =====================================================
       Q2
    ===================================================== */

    function makeProbabilityTrial() {

        return {

            type:
                jsPsychHtmlSliderResponse,


            stimulus:
                function() {

                    var beadColor =
                        trial.seq[
                            currentBeadIdx %
                            trial.seq.length
                        ];


                    var beadIndex =
                        currentBeadIdx +
                        1;


                    return `

                        <div class="task-header">
                            题目数：
                            ${trial.trialNum} / 4
                        </div>

                        <div class="current-bead-title">
                            珠子${beadIndex}
                        </div>

                        <div class="current-bead-area">

                            <div
                                class="
                                    current-bead
                                    ${beadColorMap[beadColor]}
                                ">
                            </div>

                        </div>

                        <div class="jar-container">

                            ${renderJarFixed(
                                trial.jarA,
                                jarABeads,
                                "A"
                            )}

                            ${renderJarFixed(
                                trial.jarB,
                                jarBBeads,
                                "B"
                            )}

                        </div>

                        <div class="sequence-area">

                            <div class="sequence-label">
                                已抽取序列：
                            </div>

                            <div class="sequence-beads">
                                ${renderSequence(
                                    drawnSeq
                                )}
                            </div>

                        </div>

                        <p class="question-text">
                            问题 2：
                            你估计珠子来自你选择的那个罐子的概率是多少？
                        </p>

                        <p class="question-hint">
                            0% = 完全不确定，
                            100% = 完全确定
                        </p>
                    `;

                },


            labels: [
                "0%",
                "10%",
                "20%",
                "30%",
                "40%",
                "50%",
                "60%",
                "70%",
                "80%",
                "90%",
                "100%"
            ],


            min:
                0,

            max:
                100,

            slider_start:
                50,

            step:
                10,

            require_movement:
                false,

            button_label:
                "确认",


            data:
                function() {

                    return {

                        trial:
                            trial.trialNum,

                        ratio:
                            trial.ratio,

                        bead_index:
                            currentBeadIdx +
                            1,

                        bead_color:
                            trial.seq[
                                currentBeadIdx %
                                trial.seq.length
                            ],

                        question:
                            "Q2_probability"

                    };

                },


            on_finish:
                function(data) {

                    data.q2_probability =
                        data.response;


                    data.q2_rt =
                        data.rt;


                    lastRoundQ2Value =
                        data.response;


                    if (
                        currentDraw
                    ) {

                        currentDraw.q2_probability =
                            data.q2_probability;


                        currentDraw.q2_rt =
                            data.q2_rt;

                    }

                }

        };

    }


    /* =====================================================
       Q3
    ===================================================== */

    function makeSufficiencyTrial() {

        return {

            type:
                jsPsychHtmlButtonResponse,


            stimulus:
                function() {

                    var beadColor =
                        trial.seq[
                            currentBeadIdx %
                            trial.seq.length
                        ];


                    var beadIndex =
                        currentBeadIdx +
                        1;


                    return `

                        <div class="task-header">
                            题目数：
                            ${trial.trialNum} / 4
                        </div>

                        <div class="current-bead-title">
                            珠子${beadIndex}
                        </div>

                        <div class="current-bead-area">

                            <div
                                class="
                                    current-bead
                                    ${beadColorMap[beadColor]}
                                ">
                            </div>

                        </div>

                        <div class="jar-container">

                            ${renderJarFixed(
                                trial.jarA,
                                jarABeads,
                                "A"
                            )}

                            ${renderJarFixed(
                                trial.jarB,
                                jarBBeads,
                                "B"
                            )}

                        </div>

                        <div class="sequence-area">

                            <div class="sequence-label">
                                已抽取序列：
                            </div>

                            <div class="sequence-beads">
                                ${renderSequence(
                                    drawnSeq
                                )}
                            </div>

                        </div>

                        <p class="question-text">
                            问题 3：
                            当前信息是否已经足够做出确定的罐子归属判断？
                        </p>

                        <div class="bottom-buttons">

                            <button
                                onclick="
                                    jsPsych.finishTrial({
                                        response: 0,
                                        rt:
                                            Math.round(
                                                performance.now() -
                                                currentQ3StartTime
                                            )
                                    })
                                "
                            >
                                查看下一颗珠子
                            </button>

                            <button
                                onclick="
                                    jsPsych.finishTrial({
                                        response: 1,
                                        rt:
                                            Math.round(
                                                performance.now() -
                                                currentQ3StartTime
                                            )
                                    })
                                "
                            >
                                猜罐子
                            </button>

                        </div>
                    `;

                },


            choices:
                [],


            data:
                function() {

                    return {

                        trial:
                            trial.trialNum,

                        ratio:
                            trial.ratio,

                        bead_index:
                            currentBeadIdx +
                            1,

                        bead_color:
                            trial.seq[
                                currentBeadIdx %
                                trial.seq.length
                            ],

                        question:
                            "Q3_sufficient"

                    };

                },


            on_load:
                function() {

                    currentQ3StartTime =
                        performance.now();

                },


            on_finish:
                function(data) {

                    data.q3_rt =
                        data.rt;


                    if (
                        data.response ===
                        0
                    ) {

                        data.q3_sufficient =
                            "insufficient";

                    } else {

                        data.q3_sufficient =
                            "sufficient";

                        trialFinished =
                            true;

                    }


                    /*
                        完成这一颗珠子的数据
                    */

                    if (
                        currentDraw
                    ) {

                        currentDraw.q3_sufficient =
                            data.q3_sufficient;


                        currentDraw.q3_rt =
                            data.q3_rt;


                        /*
                            深拷贝，防止后续变量变化
                        */

                        var drawToUpload =
                            Object.assign(
                                {},
                                currentDraw
                            );


                        lastDrawUploadPromise =
                            uploadBeadsDraw(
                                drawToUpload
                            );


                        pendingDatabaseOperations.push(
                            lastDrawUploadPromise
                        );

                    }


                    /*
                        注意：

                        currentBeadIdx 必须在数据上传结构生成之后再 +1
                    */

                    if (
                        data.response ===
                        0
                    ) {

                        currentBeadIdx++;

                    }

                }

        };

    }


    /* =====================================================
       Q1 → Q2 → Q3 循环
    ===================================================== */

    var beadLoopTrial = {

        timeline: [

            makeBeadTrial(),

            makeProbabilityTrial(),

            makeSufficiencyTrial()

        ],


        loop_function:
            function(data) {

                if (
                    trialFinished
                ) {

                    return false;

                }


                var lastQ3 =
                    null;


                for (
                    var i =
                        data.values().length -
                        1;

                    i >= 0;

                    i--
                ) {

                    var t =
                        data.values()[i];


                    if (
                        t.question ===
                            "Q3_sufficient"
                        &&
                        t.trial ===
                            trial.trialNum
                    ) {

                        lastQ3 =
                            t;

                        break;

                    }

                }


                if (
                    !lastQ3
                ) {

                    return false;

                }


                return (
                    lastQ3.q3_sufficient ===
                    "insufficient"
                );

            }

    };


    timeline.push(
        beadLoopTrial
    );


    /* =====================================================
       Final Decision
    ===================================================== */

    var finalDecisionTrial = {

        type:
            jsPsychHtmlButtonResponse,


        stimulus:
            function() {

                return `

                    <div class="task-header">
                        题目数：
                        ${trial.trialNum} / 4
                    </div>

                    <h2 style="text-align:center;">
                        第${trial.trialNum}试次
                        —
                        最终判断
                    </h2>

                    <div class="jar-container">

                        ${renderJarFixed(
                            trial.jarA,
                            jarABeads,
                            "A"
                        )}

                        ${renderJarFixed(
                            trial.jarB,
                            jarBBeads,
                            "B"
                        )}

                    </div>

                    <div class="sequence-area">

                        <div class="sequence-label">
                            本试次已抽取序列：
                        </div>

                        <div class="sequence-beads">
                            ${renderSequence(
                                drawnSeq
                            )}
                        </div>

                    </div>

                    <p class="question-text">
                        请做出最终判断：
                        珠子来自哪一个罐子？
                    </p>
                `;

            },


        choices: [
            "罐子 A",
            "罐子 B"
        ],


        button_html:
            '<button class="jspsych-btn" style="font-size:20px; padding:15px 35px;">%choice%</button>',


        data:
            function() {

                return {

                    trial:
                        trial.trialNum,

                    ratio:
                        trial.ratio,

                    question:
                        "Final_decision"

                };

            },


        on_finish:
            function(data) {

                data.final_jar =
                    data.response === 0
                        ?
                        "A"
                        :
                        "B";


                data.correct_jar =
                    trial.correct;


                data.is_correct =
                    data.final_jar ===
                    trial.correct
                        ?
                        1
                        :
                        0;


                var dtdVal =
                    currentBeadIdx +
                    1;


                data.dtd =
                    dtdVal;


                data.is_JTC_bias =
                    dtdVal <= 2
                        ?
                        1
                        :
                        0;


                data.dt =
                    lastRoundQ2Value;


                data.frt_ms =
                    firstBeadStartTime !==
                    null
                        ?
                        Math.round(
                            performance.now() -
                            firstBeadStartTime
                        )
                        :
                        null;


                /*
                    先等待最后一颗 bead 的 INSERT 完成，

                    再执行 RPC UPDATE，

                    避免 UPDATE 比 INSERT 先到数据库。
                */

                var trialCompletionPromise =
                    Promise
                        .resolve(
                            lastDrawUploadPromise
                        )
                        .then(
                            function() {

                                return completeBeadsTrial({

                                    trial:
                                        trial.trialNum,

                                    bead_index:
                                        dtdVal,

                                    dtd:
                                        data.dtd,

                                    final_jar:
                                        data.final_jar,

                                    correct_jar:
                                        data.correct_jar,

                                    is_correct:
                                        data.is_correct,

                                    is_JTC_bias:
                                        data.is_JTC_bias,

                                    dt:
                                        data.dt,

                                    frt_ms:
                                        data.frt_ms

                                });

                            }
                        );


                pendingDatabaseOperations.push(
                    trialCompletionPromise
                );

            }

    };


    timeline.push(
        finalDecisionTrial
    );


    return timeline;

}


/* =========================================================
   CSV
========================================================= */

function csvEscape(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    var str =
        String(
            value
        );


    if (
        str.includes(",") ||
        str.includes('"') ||
        str.includes("\n") ||
        str.includes("\r")
    ) {

        str =
            '"' +
            str.replace(
                /"/g,
                '""'
            ) +
            '"';

    }


    return str;

}


function buildCleanCSV() {

    var allData =
        jsPsych
            .data
            .get()
            .values();


    var beadRows =
        {};


    /*
        Q1 / Q2 / Q3
        → 合并成一颗珠子一行
    */

    allData.forEach(
        function(d) {

            if (
                d.question !== "Q1_jar" &&
                d.question !== "Q2_probability" &&
                d.question !== "Q3_sufficient"
            ) {

                return;

            }


            var key =
                String(d.trial) +
                "_" +
                String(d.bead_index);


            if (
                !beadRows[key]
            ) {

                beadRows[key] = {

                    subject:
                        subjectId,

                    trial:
                        d.trial,

                    ratio:
                        d.ratio,

                    bead_index:
                        d.bead_index,

                    bead_color:
                        d.bead_color,

                    q1_response:
                        "",

                    q1_rt:
                        "",

                    q2_probability:
                        "",

                    q2_rt:
                        "",

                    q3_sufficient:
                        "",

                    q3_rt:
                        "",

                    dtd:
                        "",

                    final_jar:
                        "",

                    correct_jar:
                        "",

                    is_correct:
                        "",

                    is_JTC_bias:
                        "",

                    dt:
                        "",

                    frt_ms:
                        "",

                    trialTimestamp:
                        ""

                };

            }


            var row =
                beadRows[key];


            if (
                d.question ===
                "Q1_jar"
            ) {

                row.q1_response =
                    d.q1_response;


                row.q1_rt =
                    d.q1_rt;


                row.trialTimestamp =
                    d.trialTimestamp;

            }


            if (
                d.question ===
                "Q2_probability"
            ) {

                row.q2_probability =
                    d.q2_probability;


                row.q2_rt =
                    d.q2_rt;

            }


            if (
                d.question ===
                "Q3_sufficient"
            ) {

                row.q3_sufficient =
                    d.q3_sufficient;


                row.q3_rt =
                    d.q3_rt;

            }

        }
    );


    /*
        Final Decision

        只写到该 trial 最后一颗珠子
    */

    var finalTrials =
        allData.filter(
            function(d) {

                return (
                    d.question ===
                    "Final_decision"
                );

            }
        );


    finalTrials.forEach(
        function(finalData) {

            var key =
                String(finalData.trial) +
                "_" +
                String(finalData.dtd);


            var row =
                beadRows[key];


            if (
                !row
            ) {

                return;

            }


            row.dtd =
                finalData.dtd;


            row.final_jar =
                finalData.final_jar;


            row.correct_jar =
                finalData.correct_jar;


            row.is_correct =
                finalData.is_correct;


            row.is_JTC_bias =
                finalData.is_JTC_bias;


            row.dt =
                finalData.dt;


            row.frt_ms =
                finalData.frt_ms;

        }
    );


    var rows =
        Object.values(
            beadRows
        );


    rows.sort(
        function(a, b) {

            if (
                a.trial !==
                b.trial
            ) {

                return (
                    a.trial -
                    b.trial
                );

            }


            return (
                a.bead_index -
                b.bead_index
            );

        }
    );


    var headers = [

        "subject",

        "trial",

        "ratio",

        "bead_index",

        "bead_color",

        "q1_response",

        "q1_rt",

        "q2_probability",

        "q2_rt",

        "q3_sufficient",

        "q3_rt",

        "dtd",

        "final_jar",

        "correct_jar",

        "is_correct",

        "is_JTC_bias",

        "dt",

        "frt_ms",

        "trialTimestamp"

    ];


    var csvRows = [

        headers.join(",")

    ];


    rows.forEach(
        function(row) {

            csvRows.push(

                headers
                    .map(
                        function(header) {

                            return csvEscape(
                                row[header]
                            );

                        }
                    )
                    .join(",")

            );

        }
    );


    return csvRows.join(
        "\r\n"
    );

}


function downloadCleanCSV() {

    var csv =
        buildCleanCSV();


    var blob =
        new Blob(

            [
                "\uFEFF" +
                csv
            ],

            {
                type:
                    "text/csv;charset=utf-8;"
            }

        );


    var url =
        URL.createObjectURL(
            blob
        );


    var a =
        document.createElement(
            "a"
        );


    a.href =
        url;


    a.download =
        "beads_task_" +
        subjectId +
        "_" +
        new Date()
            .toISOString()
            .slice(
                0,
                10
            ) +
        ".csv";


    document.body.appendChild(
        a
    );


    a.click();


    document.body.removeChild(
        a
    );


    URL.revokeObjectURL(
        url
    );

}


/* =========================================================
   数据库最终完成
========================================================= */

var databaseFinalized =
    false;


async function finalizeBeadsDatabase() {

    if (
        databaseFinalized
    ) {

        return;

    }


    databaseFinalized =
        true;


    /*
        等待所有：

        draw INSERT
        +
        trial completion RPC
    */

    await Promise.allSettled(
        pendingDatabaseOperations
    );


    await completeBeadsSession();

}


/* =========================================================
   结果页
========================================================= */

var resultTrial = {

    type:
        jsPsychHtmlButtonResponse,


    stimulus:
        function() {

            var allData =
                jsPsych
                    .data
                    .get()
                    .values();


            var finalTrials =
                allData.filter(
                    function(d) {

                        return (
                            d.question ===
                            "Final_decision"
                        );

                    }
                );


            var html =
                "<h2>全部试次完成！</h2>" +
                "<div class='summary-box'>" +
                "<h3>各试次结果汇总</h3>";


            finalTrials.forEach(
                function(ft) {

                    html +=
                        `<p>
                            <b>
                                第${ft.trial}试次
                            </b>
                            （${ft.ratio}）：
                            判断=${ft.final_jar}，
                            ${
                                ft.is_correct === 1
                                    ?
                                    "✓正确"
                                    :
                                    "✗错误"
                            }，
                            DTD=${ft.dtd}，
                            JTC偏差=${ft.is_JTC_bias}，
                            DT=${ft.dt}，
                            FRT(ms)=${ft.frt_ms}
                        </p>`;

                }
            );


            html +=
                "</div>" +
                "<div class='chart-container'>" +
                "<canvas id='resultChart'></canvas>" +
                "</div>";


            html +=
                "<p style='text-align:center; font-size:16px;'>" +
                "点击下方按钮下载完整数据（CSV）" +
                "</p>";


            return html;

        },


    choices: [
        "下载数据"
    ],


    button_html:
        '<button class="jspsych-btn" style="font-size:20px; padding:15px 40px;">%choice%</button>',


    on_load:
        function() {

            /*
                到结果页时，
                实验已经全部完成。

                开始数据库收尾。
            */

            finalizeBeadsDatabase()
                .catch(
                    function(error) {

                        console.error(
                            "Supabase finalization error:",
                            error
                        );

                    }
                );


            var allData =
                jsPsych
                    .data
                    .get()
                    .values();


            var q2Trials =
                allData.filter(
                    function(d) {

                        return (
                            d.question ===
                            "Q2_probability"
                        );

                    }
                );


            var labels =
                q2Trials.map(
                    function(d) {

                        return (
                            "T" +
                            d.trial +
                            "-" +
                            d.bead_index
                        );

                    }
                );


            var probs =
                q2Trials.map(
                    function(d) {

                        return (
                            d.q2_probability
                        );

                    }
                );


            var ctx =
                document
                    .getElementById(
                        "resultChart"
                    )
                    .getContext(
                        "2d"
                    );


            new Chart(
                ctx,
                {

                    type:
                        "line",

                    data: {

                        labels:
                            labels,

                        datasets: [
                            {

                                label:
                                    "估计概率 (%)",

                                data:
                                    probs,

                                borderColor:
                                    "#2d5a2d",

                                backgroundColor:
                                    "rgba(45,90,45,0.1)",

                                fill:
                                    true,

                                tension:
                                    0.3,

                                pointRadius:
                                    4

                            }
                        ]

                    },


                    options: {

                        responsive:
                            true,

                        plugins: {

                            title: {

                                display:
                                    true,

                                text:
                                    "各试次概率估计变化",

                                font: {
                                    size: 18
                                }

                            }

                        },


                        scales: {

                            y: {

                                min:
                                    0,

                                max:
                                    100,

                                title: {

                                    display:
                                        true,

                                    text:
                                        "估计概率 (%)"

                                }

                            },


                            x: {

                                title: {

                                    display:
                                        true,

                                    text:
                                        "试次-珠子序号"

                                }

                            }

                        }

                    }

                }
            );

        },


    on_finish:
        function() {

            downloadCleanCSV();

        }

};


/* =========================================================
   Timeline
========================================================= */

var timeline = [

    idTrial,

    instructions

];


trials.forEach(
    function(t) {

        timeline =
            timeline.concat(
                buildTrialTimeline(
                    t
                )
            );

    }
);


timeline.push(
    resultTrial
);


jsPsych.run(
    timeline
);