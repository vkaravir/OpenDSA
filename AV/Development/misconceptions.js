(function($) {
  "use strict";

  var gradeStepFilterFunction = function gradeStepFilterFunction(step) { return step.options.grade; };
  var allEqual = function allEqual(initial, model, compare) {
    if ($.isArray(initial)) {
      for (var i = 0; i < initial.length; i++) {
        if (!model[i].equals(initial[i], compare[i])) {
          return false;
        }
      }
      return true;
    } else {
      return model.equals(initial, compare);
    }
  };

  var grader = function(modelAv, miscAv, modelStructures, miscStructures, compare) {
    var studentSteps = 0,
        correctSteps = 0,
        correct = true,
        forwStudent = true,
        forwModel = true,
        cont = true,
        totalSteps = 0,
        modelTotal = modelAv.totalSteps(), // "cache" the size
        studentTotal = miscAv.totalSteps(); // "cache" the size
    while (forwModel && cont && modelAv.currentStep() < modelTotal &&
            miscAv.currentStep() < studentTotal) {
      forwModel = modelAv.forward();
      if (forwModel && modelAv.stepOption("grade")) {
        totalSteps++;
        forwStudent = true;
        while (forwStudent && !allEqual(miscStructures, modelStructures, compare) &&
                        miscAv.currentStep() < studentTotal) {
          forwStudent = miscAv.forward();
        }
        if (allEqual(miscStructures, modelStructures, compare)) {
          correctSteps++;
        } else {
          cont = false;
        }
      } else if (forwModel) {
        while (forwModel && !modelAv.stepOption("grade")) {
          forwModel = modelAv.forward();
        }
        modelAv.backward();
      }
    }
    while (forwModel && modelAv.currentStep() < modelTotal) {
      forwModel = modelAv.forward(gradeStepFilterFunction);
      if (forwModel) {
        totalSteps++;
      }
    }
    return [correctSteps, totalSteps];
  };
  var analyze = function analyze(correctAv, miscAv, modelStructures, miscStructures, compare) {
    correctAv.begin();
    miscAv.begin();
    $.fx.off = true;
    var score = grader(correctAv, miscAv, modelStructures, miscStructures, compare);
    correctAv.begin();
    $.fx.off = false;
    return score;
  };

  JSAV._types.Exercise.prototype.testMisconceptions = function testMisconceptions(misconceptions) {
    // run the model answer for the current input
    var correctJsav = new JSAV($("<div />")),
        correctStructures = this.options.model(correctJsav);

    var miscJsav,
        miscStructures,
        score;

    // grade the model answer to get the possible maximum score
    // run the misconceptions until:
    //   - a misconception gives full grade (-> return false)
    //   - no more misconceptions to try (-> return true)
    for (var i = 0, l = misconceptions.length; i < l; i++) {
      miscJsav = new JSAV($("<div />"));
      miscStructures = misconceptions[i](miscJsav);
      score = analyze(correctJsav, miscJsav, correctStructures, miscStructures, this.options.compare);
      if (score[0] === score[1]) { // correct points === max points
        return false;
      }
    }
    // all misconcepted versions gave lower score than correct solution, return true
    return true;
  };
})(jQuery);