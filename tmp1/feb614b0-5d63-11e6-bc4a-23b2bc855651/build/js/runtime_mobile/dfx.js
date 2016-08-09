/**!
 This notice must be untouched at all times.

 DreamFace DFX
 Version: 3.0.13
 Author: Interactive Clouds

 Copyright (c) 2016 Interactive Clouds, Inc. "DreamFace" is a trademark of Interactive Clouds, Inc.

 LICENSE: 
*/
/*
 This notice must be untouched at all times.

 DreamFace DFX
 Version: 3.0.0
 Author: Interactive Clouds

 Copyright (c) 2015 Interactive Clouds, Inc.  "DreamFace" is a trademark of Interactive Clouds, Inc.

 LICENSE: DreamFace Open License
 */

'use strict';
angular.module('dfx.utils', [])
.directive('dfxScreen', ['$compile', function ($compile) {
    return function(scope, element, attrs) {
        scope.$watch(
            function(scope) {
                // watch the 'bindUnsafeHtml' expression for changes
                return scope.$eval(attrs.dfxScreen);
            },
            function(value) {
                if (value) {
                    // when the 'bindUnsafeHtml' expression changes
                    // assign it into the current DOM
                    element.html(value);

                    setup_widgets_web();

                    // compile the new DOM and link it to the current scope.
                    // NOTE: we only compile .childNodes so that
                    // we don't get into infinite loop compiling ourselves
                    $compile(element.contents())(scope);
                }
            }
        );
    };
}])
.directive('dfxIncludeReplace', ['$compile', function ($compile) {
    return {
        require: 'ngInclude',
        restrict: 'A', /* optional */
        link: function (scope, element, attrs) {
            // apply application configuration for GCs
            if (dfx_app_conf && $user) {
                for (var i = 0; i < dfx_app_conf.length; i++) {
                    if ($user.roles && $user.roles.list && $user.roles.list.indexOf(dfx_app_conf[i].role) > -1) {
                        // apply every attribute configuration of this GC
                        for (var j = 0; j < dfx_app_conf[i].attributes.length; j++) {
                            if ( dfx_app_conf[i].attributes[j].value && dfx_app_conf[i].screen == dfx_current_screen ) {
                                switch (dfx_app_conf[i].attributes[j].name) {
                                    case "display":
                                        // find GC container and change ng-show
                                        element.find('[id^=' + dfx_app_conf[i].id + ']').attr('ng-show', dfx_app_conf[i].attributes[j].value);
                                        $compile( element.find('[id^=' + dfx_app_conf[i].id + ']') )(scope);
                                        break;
                                    case "disabled":
                                        // find all GC container children with ng-disabled and change the value
                                        element.find('[id^=' + dfx_app_conf[i].id + ']').find('[ng-disabled]').attr('ng-disabled', dfx_app_conf[i].attributes[j].value);
                                        //$compile(element.find('[id^=' + dfx_app_conf[i].id + ']').find('[ng-disabled]'))(scope);
                                        break;
                                    case "labelVisible":
                                        // find only first element - label itself and change the value
                                        element.find('[for^=' + dfx_app_conf[i].id + ']').first().attr('ng-show', dfx_app_conf[i].attributes[j].value);
                                        $compile( element.find('[for^=' + dfx_app_conf[i].id + ']') )(scope);
                                        break;
                                }
                            }
                        }
                    }
                }
            }

            // compile the changed DOM and link it to the current scope
            //$compile(element.find('[ng-controller]').children().contents())(scope);
        }
    };
}])
.directive('dfxGrid', function () {
    return function (scope, element, attrs) {

        // apply DataTable options
        var options = {
            "bStateSave": true,
            "iCookieDuration": 2419200,
            /* 1 month */
            "bJQueryUI": false,
            "bPaginate": ((attrs.dfxGridPaging==null || attrs.dfxGridPaging=='true') ? true : false),
            "bLengthChange": ((attrs.dfxGridPaging==null || attrs.dfxGridPaging=='true') ? true : false),
            "bFilter": ((attrs.dfxGridFilter==null || attrs.dfxGridFilter=='true') ? true : false),
            "bInfo": ((attrs.dfxGridPaging==null || attrs.dfxGridPaging=='true') ? true : false),
            "bDestroy": true,
            "sDom": '<"toolbar"lfrtip>'
        }

        var columns_definition = [];
        var explicitColumns = [];

        element.find('th').each(function (index, elem) {
            explicitColumns.push($('span:first', elem).text());
            var column_object = $('column', elem);

            var type = $('type', column_object).text();
            var model = $('model', column_object).text();
            var classes = $('classes', column_object).text();
            var style = $('style', column_object).text();
            var scope_function = $('scope-function', column_object).text();
            var html_content = $('html-content', column_object).html();

            scope_function = scope_function.substring( 0, scope_function.indexOf('(') );

            var rendering_function;
            var rendering_function_src;
            if (type=='link') {

                //rendering_function_src = 'return \'<a href="#" onclick="dfGCGridCallScopeFct(\'' + scope_function + '\', this)" class="' + classes + '" style="' + style + '">\' + data + \'</a>\';';
                rendering_function_src = "return '<a href=\"javascript:void(0)\" onclick=\"dfGCGridCallScopeFct(\\'" + scope_function + "\\', this)\" class=\"" + classes + "\" style=\"" + style + "\">' + data + '</a>';";

            } else if (type=='image') {

                rendering_function_src = "return '<a href=\"javascript:void(0)\" onclick=\"dfGCGridCallScopeFct(\\'" + scope_function + "\\', this)\" class=\"" + classes + "\" style=\"" + style + "\">";
                rendering_function_src += "<img src=\"' + data + '\"/></a>';";

            } else if (type=='html') {

                if (html_content!=null) {

                    var data_start = html_content.indexOf('{{');
                    while (data_start > -1) {
                        var data_end = html_content.indexOf('}}', data_start);
                        html_content = html_content.substring(0, data_start) + '\' + ' + html_content.substring(data_start + 2, data_end) + ' + \'' + html_content.substr(data_end+2);
                        data_start = html_content.indexOf('{{');
                    }

                    rendering_function_src = 'return \'<div class="' + classes + '" style="' + style + '">' + html_content + '</div>\';';

                }

            } else {

                rendering_function_src = 'return \'<div class="' + classes + '" style="' + style + '">\' + data + \'</div>\';';

            }

            rendering_function = new Function( 'data', 'type', 'item', rendering_function_src );

            var column_definition = {
                "mDataProp": model,
                "aTargets": [index],
                "mRender": rendering_function
            }
            columns_definition.push( column_definition );
        });

        if (explicitColumns.length > 0) {
            //options["aoColumns"] = explicitColumns;
            options["aoColumnDefs"] = columns_definition;
        }

        if (attrs.fnRowCallback) {
            options["fnRowCallback"] = scope.$eval(attrs.fnRowCallback);
        }

        // apply the plugin
        var dataTable = element.dataTable(options);
        dataTable.fnSettings().oScope = scope;
        dataTable.bind('dataLoaded', { "dt": dataTable, "scope": scope, "data_loaded_function": attrs.dfxGridDataloaded}, function (e) {
            if (e.data.data_loaded_function && e.data.data_loaded_function!='') {
                var arg_pos = e.data.data_loaded_function.indexOf('(');
                var fct_name ;
                if (arg_pos>-1) {
                    fct_name = e.data.data_loaded_function.substring( 0, arg_pos );
                } else {
                    fct_name = e.data.data_loaded_function;
                }
                var dyn_source = 'return scope.' + fct_name + '({"data": data, "dt": dt});';
                var dyn_function = new Function( 'scope', 'data', 'dt', dyn_source );
                var data = e.data.dt.fnGetData();
                dyn_function( scope, data, e.data.dt );
            }
        });

        // watch for any changes to our data, rebuild the DataTable
        scope.$watch(attrs.aaData, function (value) {
            var val = value || null;
            if (val) {
                dataTable.fnClearTable();
                dataTable.fnAddData(scope.$eval(attrs.aaData));
                dataTable.trigger('dataLoaded');
            }
        });
    };
})
.directive('dfxWizard', function () {
    return function (scope, el, attr, ngModel) {
        var o = null;
        scope.currentStep = 1;
        $(el).wizard();
        o = $(el).wizard('getObject');
        scope.numSteps = o.numSteps;
        $(el).on('changed', function(e, data){
            scope.currentStep = data.currentStep;
            scope.$broadcast('selectedItem');
        });
    };
})
// ***********************************************************
//    Additional directives used by DFX
// ***********************************************************
.directive("inputMask", ['$parse', function ($parse) {
    return {
        restrict: 'A', // only as attribute
        require: "?ngModel", // get a hold of NgModelController
        link: function (scope, el, attr, ngModel) {
            if (!ngModel) {
                return; // do nothing if no ng-model
            }

            // to correct Number
            var toNum = function(val, decSep){
                if(!decSep){
                    decSep = '.';
                }
                var toNumberRegex = new RegExp('[^0-9-\\'+decSep+']', 'g'), res = val;
                if(typeof val == 'string'){
                    res = val.replace(toNumberRegex, '');
                    if(decSep == ','){
                        res = res.replace(',', '.');
                    }
                    res = parseFloat(res);
                }
                return res;
            }
            /*
             I made my validator,
             because if there is an initial value with ng-init,
             the validation does not work correctly with min, max length.
             Check If no mask and set: ng-init=22, ng-minlength=2, ng-maxlength=10 -
             ng-init value is not added to input field
             */
            // validator
            var validate = function (value) {
                if (!ngModel.$isEmpty(value)) {
                    var minLen = (attr.ngMinlength) ? parseInt(attr.ngMinlength, 10) : 0, // ngMinlength
                        maxLen = (attr.ngMaxlength) ? parseInt(attr.ngMaxlength, 10) : 0,  // ngMaxlength
                        pattern = attr.ngPattern, // ngPattern
                        match = (pattern) ? pattern.match(/^\/(.*)\/([gim]*)$/) : 0,
                        lenErr = false, cond1 =false, cond2 = false;

                    if (match) {
                        pattern = new RegExp(match[1], match[2]);
                    }

                    ngModel.$setValidity("pattern", true);

                    // remove comma when mask is decimal to true model value
                    if(attr.inputMask == "'decimal'" && attr.maskGroupsep && typeof value == 'string') {
                        value = toNum(value, attr.maskDecsep);
                    }

                    if(typeof value == 'number'){
                        value = value.toString();
                    }

                    cond1 = minLen && value.length < minLen; // if length of value < minLength
                    cond2 = maxLen && value.length > maxLen; // if length of value > minLength

                    // check length
                    if ( (cond1) || (cond2) ) {
                        //ngModel.$setValidity("length", false);
                        lenErr = true;
                        if ( cond1) {
                            ngModel.$setValidity('minlength', false); // length < minLength
                        }
                        if( cond2 ){
                            ngModel.$setValidity("maxlength", false); // length > maxLength
                        }
                    }
                    else {
                        //ngModel.$setValidity("length", true);
                        ngModel.$setValidity("minlength", true);
                        ngModel.$setValidity("maxlength", true);
                        lenErr = false;
                    }

                    // check pattern
                    if (!lenErr) {
                        if (match && !pattern.test(value)) {
                            ngModel.$setValidity("pattern", false);
                        }
                        else {
                            ngModel.$setValidity("pattern", true);
                        }
                    }
                } else {
                    ngModel.$setValidity("length", true);
                    ngModel.$setValidity("pattern", true);
                }
                return value;
            }

            if (attr.ngModel) {
                // add custom validator
                ngModel.$parsers.push(validate);
                ngModel.$formatters.push(validate);
                /*
                 In our directive we can add $formatters that do exactly what we need and
                 $parsers, that do the other way around (parse the value before it goes to the model).
                 */
                // we need to add init value

                ngModel.$formatters.unshift(function(value) {
                    // we add
                    // what you return will be passed to the text field
                    var val = value || ngModel.$modelValue;
                    if(val){
                        // init value for inputmask
                        $(el).val(val).blur();
                        // write data to ngModel
                        ngModel.$setViewValue(val);
                        // we can get value - ngModel.$viewValue
                    }
                    return val;
                });
                /*
                 ngModel.$parsers.push(function(valueFromInput) {
                 // put the inverse logic, to transform formatted data into model data
                 // what you return, will be stored in the $scope
                 // return ...;
                 });
                 */
            }
            var props = {};
            if(attr.maskGroupsep){
                props.groupSeparator = attr.maskGroupsep;
                props.autoGroup = true;
            }
            if(attr.maskDecsep){
                props.radixPoint = attr.maskDecsep;
            }
            if(attr.maskDigits){
                props.digits = attr.maskDigits;
            }

            $(el).inputmask(scope.$eval(attr.inputMask),props); // add jquery inputmask plugin
            // keyUp
            el.on('keyup', function (e) {
                var val = el.val();
                // when mask is decimal - remove ', .' as group separator to true model value as number
                if(attr.inputMask == "'decimal'" && attr.maskGroupsep && typeof val == 'string'){
                    val = toNum(val, attr.maskDecsep)
                }
                // apply scope
                scope.$apply(function(){
                    ngModel.$setViewValue(val);
                });
            });
        }
    };
}])
.directive('dfxDate', function() {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function ($scope, el, attr, ngModel) {
            var textfield = $('input', el),
                format = $(el).data('dateFormat'),
                startDate = $(el).data('dateStart'),
                endDate = $(el).data('dateEnd'),
                childInput = $(el).find('input');
            if (childInput.hasClass('input-sm')) {
                $(el).addClass('input-group-sm');
            } else if (childInput.hasClass('input-lg')) {
                $(el).addClass('input-group-lg');
            }

            setTimeout(function() {
                if(ngModel.$viewValue){
                    $(el).attr('data-date', ngModel.$viewValue);
                    textfield.val(ngModel.$viewValue)
                }
                // date picker
                $(el).datepicker({'autoclose':true, 'forceParse': false, 'startDate': startDate, 'endDate':endDate})
                    .on('changeDate', function(e) {
                        var nDate = textfield.val();
                        $(this).attr('data-date',nDate);
                        // set model value
                        ngModel.$setViewValue(nDate);
                        // for $watch
                        $scope.$digest();
                        ngModel.$setValidity('isdate', true);
                    });
            }, 10);

            function validate(value) {
                if(value){
                    var d = isValidDate(value, format, startDate, endDate);
                    // check if it is a date
                    if (!d) {
                        ngModel.$setValidity('isdate', false);
                        //console.log('bad')
                    } else {
                        ngModel.$setValidity('isdate', true);
                        //console.log('true')
                    }
                    //console.log(ngModel.$error)
                } else {
                    if($(el).find('input').attr('required')){
                        ngModel.$setValidity('isdate', false);
                        //console.log('empty data')
                    } else {
                        ngModel.$setValidity('isdate', true);
                    }
                }
                //console.log(ngModel.$error)
            }

            $scope.$watch(function () {
                return ngModel.$viewValue;
            }, validate);
        }
    };
})
.directive('dfxText', ['$timeout', function($timeout){
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function (scope, el, attr, ngModel) {
            var init = true;
            try{
                scope.$watch(
                    attr.dfxText,
                    function( newValue, oldValue ) {
                        if (init) {
                            $timeout(function() {
                                init = false;
                                if(!newValue){
                                    newValue = attr.textBind;
                                }
                                el.text(newValue);
                            });
                        } else {
                            if(newValue != oldValue){
                                el.text(newValue);
                            }
                        }
                    }
                );
            } catch (e){}
        }
    }
}])
.directive('dfxToolTip', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function (scope, el, attr, ngModel) {
            var init = true;
            try{
                scope.$watch(
                    attr.tooltipTitle,
                    function( newValue, oldValue ) {
                        if (init) {
                            $timeout(function() {
                                init = false;
                                if(!newValue){
                                    newValue = attr.tooltipTitle;
                                }
                                $(el).tooltip({'title':newValue});
                            });
                        } else {
                            if(newValue != oldValue){
                                $(el)
                                .attr('data-original-title', newValue)
                                .tooltip('fixTitle');
                                if($(el).next('div.tooltip:visible').length){
                                    $(el).tooltip('show');
                                } else {
                                    $(el).tooltip('hide');
                                }
                            }
                        }
                    }
                );
            } catch (e){
                $(el).tooltip({'title':attr.tooltipTitle});
            }
        }
    }
}])
.directive('dfxSpinner', ['$timeout', function($timeout){
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function (scope, el, attr, ngModel) {
            if(attr.class.indexOf('input-sm') > -1){
                $(el).closest('.input-group').addClass('input-group-sm');
            } else if(attr.class.indexOf('input-lg') > -1) {
                $(el).closest('.input-group').addClass('input-group-lg');
            }
            function isInt(n) {
                return n % 1 === 0;
            }
            var opts = {
                min: attr.min || -1000000000,
                max: attr.max || 1000000000,
                step: attr.step || 1,
                verticalbuttons: !!(attr.vertical == 'yes'),
                forcestepdivisibility: 'none'
            }
            if( !isInt(parseFloat(opts.step)) ){
                opts.decimals = 2;
            }
            $(el).TouchSpin(opts);
            el.on('change', function(e){
                var val = el.val();
                scope.$apply(function(){
                    ngModel.$setViewValue(val);
                });
            }).on('keydown', function (e) {  // only number
                // Allow: backspace, delete, tab, escape, enter and .
                if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
                    // Allow: Ctrl+A
                    (e.keyCode == 65 && e.ctrlKey === true) ||
                    // Allow: home, end, left, right
                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                    // let it happen, don't do anything
                    return;
                }
                // Ensure that it is a number and stop the keypress
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                }

            }).on('keyup', function (e) {
                $(this).trigger('change');
            })
        }
    }
}])
.directive('dfxRating', ['$timeout', function($timeout){
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, el, attr, ngModel) {
            $timeout(function() {
                var $i = scope.$index || null,
                    $p = ($i) ? $('[id^="' + attr.id + '"]')[$i] : $('[id^="' + attr.id + '"]');
                if(attr.dataFgcolor){
                    //$('.rating-stars', $p).css({'color': attr.fgcolor});
                    $p.prev().css({'color': attr.dataFgcolor});
                }
                if(attr.dataBgcolor){
                    //$('.rating-container', $p).css({'color': attr.bgcolor});
                    $p.parent().css({'color': attr.dataBgcolor});
                }
                var opts = {
                    showCaption: !!((attr.showCaption == "true")),
                    showClear: !!((attr.showClear == "true"))
                    //size: attr.size || 'md' //TODO: is not taken into account?
                };
                el.rating('refresh',opts);
                el.on('rating.clear', function(event) {
                    scope.$apply(function() {
                        if(ngModel){
                            ngModel.$setViewValue(el.val());
                        }
                    });
                });
            }, 0);

            var updateRating = function(value) {
                el.rating('update', value);
            };
            scope.$watch(function () {
                return (ngModel) ? ngModel.$modelValue : 0;
            }, updateRating);
        }
    }
}])
.directive('dfxKnob', ['$timeout', function($timeout){
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, el, attr, ngModel) {
            var _validate = function (v, step) {
                var val = (~~ (((v < 0) ? -0.5 : 0.5) + (v/step))) * step;
                return Math.round(val * 100) / 100;
            };
            $timeout(function() {
                el.knob({
                    "min": parseInt(attr.min),
                    "max": parseInt(attr.max),
                    "step": parseInt(attr.step),
                    "draw" : function () {
                        if (attr.symbolPosition && attr.symbol) {
                            var res = '';
                            if (attr.symbolPosition == 'left'){
                                res = attr.symbol + el.val();
                            } else if(attr.symbolPosition == 'right') {
                                res = el.val() + attr.symbol;
                            }

                            $(this.i).val(res);
                        }
                    },
                    "change" : function (v) {
                        scope.$apply(function() {
                            if(ngModel){
                                ngModel.$setViewValue(_validate(v, parseInt(attr.step)));
                            }
                        });
                        if (attr.change) {
                            var bracketsPos = attr.change.indexOf('(');
                            var changeFunc = (bracketsPos > -1) ? attr.change.substring(0, bracketsPos) : attr.change;
                            if (scope[changeFunc]) {
                                scope[changeFunc]();
                            }
                        }
                    }
                });
            }, 0);
            var updateKnob = function(value) {
                if (value) el.val(value).trigger('change');
            };
            scope.$watch(function () {
                return (ngModel) ? ngModel.$modelValue : 0;
            }, updateKnob);
        }
    }
}])
.directive('dfxSlider', ['$timeout', function($timeout){
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, el, attr, ngModel) {
            $timeout(function() {
                var newOpts = {
                    range: {
                        'min': Number(attr.min) || 0,
                        'max': Number(attr.max) || 100
                    }
                };
                // start
                newOpts.start = [0];
                if(ngModel && ngModel.$modelValue){
                    newOpts.start = ngModel.$modelValue;
                } else {
                    if(attr.startMin || attr.startMax){
                        if(attr.startMin && attr.startMax){
                            newOpts.start[0] = attr.startMin;
                            newOpts.start[1] = attr.startMax;
                        } else {
                            if(attr.startMin){
                                newOpts.start[0] = attr.startMin;
                            } else if(attr.startMax) {
                                newOpts.start[0] = attr.startMax;
                            }
                        }
                    }
                }
                // connect
                if(attr.connect){
                    if(newOpts.start.length == 1 || typeof newOpts.start == 'number'){
                        if(!(attr.connect == 'lower' || attr.connect == 'upper')){
                            newOpts.connect = 'lower';
                        } else {
                            newOpts.connect = attr.connect;
                        }
                    } else if(newOpts.start.length == 2){
                        if(attr.connect == 'true' || attr.connect == 'false'){
                            newOpts.connect = !!((attr.connect == 'true'));
                        } else {
                            newOpts.connect = false;
                        }
                    }
                }
                newOpts.step = Number(attr.step) || 1;
                newOpts.orientation = attr.orientation;
                newOpts.direction = attr.direction;
                newOpts.behaviour = attr.behaviour;
                el.noUiSlider(newOpts);
                if (attr.fgcolor) {
                    $( '.noUis-connect', '#' + attr.id + '_slider').css({'background-color': attr.fgcolor});
                }
                if (attr.bgcolor) {
                    $( '.noUis-background', '#' + attr.id + '_slider').css({'background-color': attr.bgcolor});
                }
                if (attr.handlecolor) {
                    $( '.noUis-handle', '#' + attr.id + '_slider').css({'background-color': attr.handlecolor});
                }
                el.on('change slide set', function(){
                    var el_val = (el.val()) ? parseInt(el.val()) : 0;
                    var view_val = (ngModel) ? ((ngModel.$viewValue) ? parseInt(ngModel.$viewValue) : 0) : 0;
                    if (el_val != view_val) {
                        scope.$apply(function () {
                            if (ngModel) {
                                var arr = el.val();
                                if (typeof arr == 'object') {
                                    arr[0] = parseInt(arr[0]);
                                    if (arr.length == 2) {
                                        arr[1] = parseInt(arr[1]);
                                    }
                                } else {
                                    arr = parseInt(arr);
                                }
                                ngModel.$setViewValue(arr);
                            }
                        });
                    }
                });
                if (attr.onslide) {
                    var bracketsPos = attr.onslide.indexOf('(');
                    var onslideFunc = (bracketsPos > -1) ? attr.onslide.substring(0, bracketsPos) : attr.onslide;
                    if (scope[onslideFunc]) {
                        el.on('slide', scope[onslideFunc]);
                    }
                }
                if (attr.onset) {
                    var bracketsPos = attr.onset.indexOf('(');
                    var onsetFunc = (bracketsPos > -1) ? attr.onset.substring(0, bracketsPos) : attr.onset;
                    if (scope[onsetFunc]) {
                        el.on('set', scope[onsetFunc]);
                    }
                }
            }, 0);
            var updateSlider = function(value) {
                el.val(value);
            };
            scope.$watch(function () {
                return (ngModel) ? ngModel.$modelValue : 0;
            }, updateSlider);
        }
    }
}])
.directive('dfxChart', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function (scope, el, attr) {
            angular.element(document).ready(function() {
                $timeout(function() {
                    scope.$apply(function() {
                        scope.config = {};
                        scope.config.legend = {};
                        scope.config.legend.position = attr.legendPosition || 'left';
                        scope.config.legend.display = (attr.legendVisible == "yes" ? true : false);
                        scope.config.title = (attr.labelVisible == "yes") ? attr.label : '';
                        scope.config.labels = (attr.labelsDataPoints == "yes" ? true : false);
                        scope.config.tooltips = (attr.tooltips == "yes" ? true : false);
                        if(attr.innerRadius){
                            scope.config.innerRadius = attr.innerRadius;
                        }
                        var assignHandler = function(fn_name, handler_name) {
                            if (fn_name) {
                                if (fn_name.indexOf('(') !== -1) {fn_name = fn_name.substring(0, fn_name.indexOf('('));}
                                scope.config[handler_name] = scope[fn_name];
                            }
                        }
                        if (attr.chartClick) {
                            assignHandler(attr.chartClick, 'click');
                        }
                        if (attr.chartMouseover) {
                            assignHandler(attr.chartMouseover, 'mouseover');
                        }
                        if (attr.chartMouseout) {
                            assignHandler(attr.chartMouseout, 'mouseout');
                        }
                    });
                }, 0);
            });
        }
    }
}])
.directive('dfxNgSrc', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function (scope, el, attr) {
            console.log('attr.ngSrc: ', attr.ngSrc);
            console.log("el.attr('ng-src'): ", el.attr('ng-src'));

            //TODO: get tenantId, appName, check normal URL, check why expression is moved to External URL...

            // watch the Image ng-src changes to transform resource URL
            var ngSrcInitial = el.attr('ng-src'),
                chunks = ngSrcInitial.match(/\{\{([^{}]*)\}\}/);

            if (chunks) {
                scope.$watch(
                    chunks[1],
                    function( newValue, oldValue ) {
                        console.log('oldValue: ', oldValue);
                        console.log('newValue: ', newValue);
                        var ngSrcVal = newValue,
                            tenantId = 'Examples',
                            applicationName = '';

                        //if (ngSrcVal && ngSrcVal.indexOf('./') == 0)
                        var resourceSrc = '/resources/' + tenantId + '/' + applicationName + ngSrcVal;
                        el.attr('ng-src', resourceSrc);
                        el.attr('src', resourceSrc);
                    }
                );
            }

            // transform resource URL from Image ng-src
            angular.element(document).ready(function() {
                $timeout(function () {
                    var ngSrcVal = el.attr('ng-src'),
                        tenantId = 'Examples',
                        applicationName = '';


                    //if (ngSrcVal && ngSrcVal.indexOf('./') == 0)
                    var resourceSrc = '/resources/' + tenantId + '/' + applicationName + ngSrcVal;
                    el.attr('ng-src', resourceSrc);
                    el.attr('src', resourceSrc);


                }, 0);
            });
        }
    }
}])
.directive('bsSwitch', ['$parse', '$timeout', function ($parse, $timeout) {
    return {
        restrict: 'A',
        require: '?ngModel',
        scope: {
            checklist: '=dfxCheckToggle',
            value: '@'
        },
        link: function link(scope, element, attrs, controller) {
            var isInit = false;
            var fnChange = attrs.onswitch || '';
            /**
             * Return the true value for this specific checkbox.
             * @returns {Object} representing the true view value; if undefined, returns true.
             */
            var getTrueValue = function() {
                var trueValue = attrs.ngTrueValue;
                /*
                 if (!angular.isString(trueValue)) {
                 trueValue = true;
                 }
                 */
                return trueValue;
            };
            /*
             var getBooleanFromString = function(value) {
             return (value === true || value === 'true' || !value);
             };
             */
            /**
             * If the directive has not been initialized yet, do so.
             */
            var initMaybe = function() {
                // if it's the first initialization
                if (!isInit) {
                    var viewValue = (controller.$modelValue == getTrueValue()),
                        dsbl = !!((attrs.ngDisabled == "true"));

                    isInit = !isInit;
                    // Bootstrap the switch plugin
                    element.bootstrapSwitch({
                        state: viewValue,
                        disabled: dsbl
                    });
                }
            };

            var setActive = function(active) {
                element.bootstrapSwitch('disabled', !active);
            };

            /**
             * Listen to model changes.
             */
            var listenToModel = function () {
                // When the model changes
                scope.$parent.$watch(attrs.ngModel, function(newValue, oldValue) {
                    initMaybe();
                    if (newValue !== undefined) {
                        $timeout(function() {
                            //console.log(newValue, getTrueValue(), newValue === getTrueValue() )
                            element.bootstrapSwitch('state', newValue === getTrueValue());
                        }, 0, false);
                    } else {
                        if(element.attr('type') == 'checkbox'){
                            element.bootstrapSwitch('state', false, true);
                        }

                    }
                });

                // on switch
                element.on('switchChange.bootstrapSwitch', function (e, data) {
                    $timeout(function() {
                        if(fnChange && scope.$parent[fnChange]) {
                            scope.$parent[fnChange]();
                        }
                    }, 0);
                });
                // observers attributes
                attrs.$observe('switchOnText', function (newValue) {
                    element.bootstrapSwitch('onText', getValueOrUndefined(newValue));
                });

                attrs.$observe('switchOffText', function (newValue) {
                    element.bootstrapSwitch('offText', getValueOrUndefined(newValue));
                });

                attrs.$observe('switchOnColor', function (newValue) {
                    attrs.dataOn = newValue;
                    element.bootstrapSwitch('onColor', getValueOrUndefined(newValue));
                });

                attrs.$observe('switchOffColor', function (newValue) {
                    attrs.dataOff = newValue;
                    element.bootstrapSwitch('offColor', getValueOrUndefined(newValue));
                });

                attrs.$observe('switchAnimate', function (newValue) {
                    element.bootstrapSwitch('animate', scope.$eval(newValue || 'true'));
                });

                attrs.$observe('switchSize', function (newValue) {
                    element.bootstrapSwitch('size', newValue);
                });

                attrs.$observe('switchLabel', function (newValue) {
                    element.bootstrapSwitch('labelText', newValue ? newValue : '&nbsp;');
                });

                attrs.$observe('switchIcon', function (newValue) {
                    if (newValue) {
                        // build and set the new span
                        var spanClass = '<span class=\'' + newValue + '\'></span>';
                        element.bootstrapSwitch('labelText', spanClass);
                    }
                });

                attrs.$observe('switchWrapper', function (newValue) {
                    // Make sure that newValue is not empty, otherwise default to null
                    if (!newValue) {
                        newValue = null;
                    }
                    element.bootstrapSwitch('wrapperClass', newValue);
                });

                attrs.$observe('switchHandleWidth', function (newValue) {
                    element.bootstrapSwitch('handleWidth', getValueOrUndefined(newValue));
                });

                attrs.$observe('switchLabelWidth', function (newValue) {
                    element.bootstrapSwitch('labelWidth', getValueOrUndefined(newValue));
                });

            };

            /**
             * Listen to view changes.
             */
            var listenToView = function () {
                // When the switch is clicked, set its value into the ngModel
                element.on('switchChange.bootstrapSwitch', function (e, data) {
                    var newValue = (data) ? attrs.ngTrueValue : data;
                    //console.log(newValue)
                    scope.$apply(function() {
                        controller.$setViewValue(newValue);
                    });
                });
            };

            /**
             * Returns the value if it is truthy, or undefined.
             *
             * @param value The value to check.
             * @returns the original value if it is truthy, {@link undefined} otherwise.
             */
            var getValueOrUndefined = function (value) {
                return (value ? value : undefined);
            };

            // Listen and respond to view changes
            listenToView();

            // Listen and respond to model changes
            listenToModel();

            // On destroy, collect ya garbage
            scope.$on('$destroy', function () {
                element.bootstrapSwitch('destroy');
            });
        }
    };
}])
.directive('dfxRequired', ['$parse', '$timeout', function ($parse, $timeout) {
    return {
        require: '?ngModel',
        link: function($scope, elem, attrs, controller) {
            //var isInit = false;
            var idd = attrs.id.split('_'),
                realid = idd.length>1 ? idd[1] : '',
                checkboxes = elem.closest('div').find('input[type!="hidden"]'),
                arrFalseValues = [],
                arrTrueValues = [],
                allValues = {};
            var getValues = function(){
                var res = {};
                angular.forEach(checkboxes, function(el, key){
                    arrTrueValues.push(angular.element(el).attr('ng-true-value'));
                    arrFalseValues.push(angular.element(el).attr('ng-false-value'));
                });
                res.trueValues = arrTrueValues;
                res.falseValues = arrFalseValues;
                return res;
            }
            var validate = function(arr){
                var index, allValues = getValues(), isFalse=true;
                if(typeof arr =='object'){
                    for(var i= 0, len=arr.length; i<len; i++){
                        if(arr[i] == allValues.trueValues[i]) {
                            isFalse = false;
                            break;
                        }
                    }
                } else {
                    if(arr == allValues.trueValues[0]){
                        isFalse = false;
                    }
                }
                if(!isFalse){
                    controller.$setValidity('required', true);
                } else {
                    controller.$setValidity('required', false);
                }
            }
            $scope.$watchCollection(attrs.ngModel, function (newValue) {
                $timeout(function() {
                    validate(newValue);
                }, 0);
            });
        }
    };
}])
.directive('dfxCheckList', ['$parse', '$timeout', function ($parse, $timeout) {
    return {
        scope: {
            list: '=dfxCheckList',
            value: '@'
        },
        link: function(scope, elem, attrs) {
            if(!scope.list){
                scope.list = [];
            }
            var fnChange = attrs.ngChange || '';
            var handler = function(setup) {
                var checked = elem.prop('checked');
                var index = scope.list.indexOf(scope.value);

                if (checked && index == -1) {
                    if (setup) {
                        elem.prop('checked', false);
                    } else {
                        scope.list.push(scope.value);
                    }
                } else if (!checked && index != -1) {
                    if (setup){
                        elem.prop('checked', true);
                    } else {
                        scope.list.splice(index, 1);
                    }
                }
            };

            var setupHandler = handler.bind(null, true);
            var changeHandler = handler.bind(null, false);

            elem.bind('change', function() {
                scope.$apply(changeHandler);
                $timeout(function() {
                    if(fnChange && scope.$parent[fnChange]) {
                        scope.$parent[fnChange]();
                    }
                }, 0);
            });
            /*
            scope.$parent.$watch(attrs.ngModel, function(newValue) {
                console.log(attrs.id,'=',newValue)
            })
            */
            scope.$watch('list', function(newValue, oldValue){
                //scope['checked_'+attrs.name] = false;
                setupHandler();
            });
        }
    };
}])
.directive('dfxCarouselChange', ['$parse', '$timeout', function ($parse, $timeout) {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, el, attr, ngModel) {
            // if 'variable' has a value, but it's not initialized in scope
            if (scope[attr.currindex] == undefined) {
                var items = el.find('div[ng-class]');
                if (items.length > 0) angular.element(items[0]).addClass('active');
            }

            var assignHandler = function(fn_name, handler_name) {
                if (fn_name) {
                    if (fn_name.indexOf('(') !== -1) {fn_name = fn_name.substring(0, fn_name.indexOf('('));}
                }
                el.on(handler_name, function(e){
                    var carouselData = $(this).data('bs.carousel');
                    e.carouselIndex = carouselData.getItemIndex(carouselData.$element.find('.item.active'));
                    if(ngModel){
                        scope.$apply(function(){
                            ngModel.$setViewValue(e.carouselIndex);
                        });
                    }
                    if (fn_name) {
                        scope[fn_name]( e );
                    }
                });
            }
            $timeout(function() {
                if(attr.onslide || attr.onslid) {
                    if(attr.onslide){
                        assignHandler(attr.onslide, 'slide.bs.carousel');
                    }
                    if(attr.onslid){
                        assignHandler(attr.onslid, 'slid.bs.carousel');
                    }
                } else {
                    assignHandler('', 'slid.bs.carousel')
                }
            }, 0);
        }
    }
}])
.directive('abnTree', [
    '$timeout', function($timeout) {
        return {
            restrict: 'E',
            template: "<ul class=\"nav nav-list nav-pills nav-stacked abn-tree\">\n  <li ng-repeat=\"row in tree_rows | filter:{visible:true} track by row.branch.uid\" ng-animate=\"'abn-tree-animate'\" ng-class=\"'level-' + {{ row.level }} + (row.branch.selected ? ' active':'')\" class=\"abn-tree-row\">\n    <a ng-click=\"user_clicks_branch(row.branch)\">\n      <i ng-class=\"row.tree_icon\" ng-click=\"row.branch.expanded = !row.branch.expanded\" class=\"indented tree-icon\"> </i>\n      <span class=\"indented tree-label\">{{ row.label }} </span>\n    </a>\n  </li>\n</ul>",
            replace: true,
            scope: {
                treeData: '=',
                onSelect: '&',
                initialSelection: '@',
                treeControl: '='
            },
            link: function(scope, element, attrs) {
                var error, expand_all_parents, expand_level, for_all_ancestors, for_each_branch, get_parent, n, on_treeData_change, select_branch, selected_branch, tree;
                error = function(s) {
                    console.log('ERROR:' + s);
                    debugger;
                    return void 0;
                };
                if (attrs.iconExpand == null) {
                    attrs.iconExpand = 'icon-plus  glyphicon glyphicon-plus  fa fa-plus';
                }
                if (attrs.iconCollapse == null) {
                    attrs.iconCollapse = 'icon-minus glyphicon glyphicon-minus fa fa-minus';
                }
                if (attrs.iconLeaf == null) {
                    attrs.iconLeaf = 'icon-file  glyphicon glyphicon-file  fa fa-file';
                }
                if (attrs.expandLevel == null) {
                    attrs.expandLevel = '3';
                }
                expand_level = parseInt(attrs.expandLevel, 10);
                if (!scope.treeData) {
                    alert('no treeData defined for the tree!');
                    return;
                }
                if (scope.treeData.length == null) {
                    if (treeData.label != null) {
                        scope.treeData = [treeData];
                    } else {
                        alert('treeData should be an array of root branches');
                        return;
                    }
                }
                for_each_branch = function(f) {
                    var do_f, root_branch, _i, _len, _ref, _results;
                    do_f = function(branch, level) {
                        var child, _i, _len, _ref, _results;
                        f(branch, level);
                        if (branch.children != null) {
                            _ref = branch.children;
                            _results = [];
                            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                                child = _ref[_i];
                                _results.push(do_f(child, level + 1));
                            }
                            return _results;
                        }
                    };
                    _ref = scope.treeData;
                    _results = [];
                    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                        root_branch = _ref[_i];
                        _results.push(do_f(root_branch, 1));
                    }
                    return _results;
                };
                selected_branch = null;
                select_branch = function(branch) {
                    if (!branch) {
                        if (selected_branch != null) {
                            selected_branch.selected = false;
                        }
                        selected_branch = null;
                        return;
                    }
                    if (branch !== selected_branch) {
                        if (selected_branch != null) {
                            selected_branch.selected = false;
                        }
                        branch.selected = true;
                        selected_branch = branch;
                        expand_all_parents(branch);
                        if (branch.onSelect != null) {
                            return $timeout(function() {
                                return branch.onSelect(branch);
                            });
                        } else {
                            if (scope.onSelect != null) {
                                return $timeout(function() {
                                    return scope.onSelect({
                                        branch: branch
                                    });
                                });
                            }
                        }
                    }
                };
                scope.user_clicks_branch = function(branch) {
                    if (branch !== selected_branch) {
                        return select_branch(branch);
                    }
                };
                get_parent = function(child) {
                    var parent;
                    parent = void 0;
                    if (child.parent_uid) {
                        for_each_branch(function(b) {
                            if (b.uid === child.parent_uid) {
                                return parent = b;
                            }
                        });
                    }
                    return parent;
                };
                for_all_ancestors = function(child, fn) {
                    var parent;
                    parent = get_parent(child);
                    if (parent != null) {
                        fn(parent);
                        return for_all_ancestors(parent, fn);
                    }
                };
                expand_all_parents = function(child) {
                    return for_all_ancestors(child, function(b) {
                        return b.expanded = true;
                    });
                };
                scope.tree_rows = [];
                on_treeData_change = function() {
                    var add_branch_to_list, root_branch, _i, _len, _ref, _results;
                    for_each_branch(function(b, level) {
                        if (!b.uid) {
                            return b.uid = "" + Math.random();
                        }
                    });
                    //console.log('UIDs are set.');
                    for_each_branch(function(b) {
                        var child, _i, _len, _ref, _results;
                        if (angular.isArray(b.children)) {
                            _ref = b.children;
                            _results = [];
                            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                                child = _ref[_i];
                                _results.push(child.parent_uid = b.uid);
                            }
                            return _results;
                        }
                    });
                    scope.tree_rows = [];
                    for_each_branch(function(branch) {
                        var child, f;
                        if (branch.children) {
                            if (branch.children.length > 0) {
                                f = function(e) {
                                    if (typeof e === 'string') {
                                        return {
                                            label: e,
                                            children: []
                                        };
                                    } else {
                                        return e;
                                    }
                                };
                                return branch.children = (function() {
                                    var _i, _len, _ref, _results;
                                    _ref = branch.children;
                                    _results = [];
                                    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                                        child = _ref[_i];
                                        _results.push(f(child));
                                    }
                                    return _results;
                                })();
                            }
                        } else {
                            return branch.children = [];
                        }
                    });
                    add_branch_to_list = function(level, branch, visible) {
                        var child, child_visible, tree_icon, _i, _len, _ref, _results;
                        if (branch.expanded == null) {
                            branch.expanded = false;
                        }
                        if (!branch.children || branch.children.length === 0) {
                            tree_icon = attrs.iconLeaf;
                        } else {
                            if (branch.expanded) {
                                tree_icon = attrs.iconCollapse;
                            } else {
                                tree_icon = attrs.iconExpand;
                            }
                        }
                        scope.tree_rows.push({
                            level: level,
                            branch: branch,
                            label: branch.label,
                            tree_icon: tree_icon,
                            visible: visible
                        });
                        if (branch.children != null) {
                            _ref = branch.children;
                            _results = [];
                            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                                child = _ref[_i];
                                child_visible = visible && branch.expanded;
                                _results.push(add_branch_to_list(level + 1, child, child_visible));
                            }
                            return _results;
                        }
                    };
                    _ref = scope.treeData;
                    _results = [];
                    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                        root_branch = _ref[_i];
                        _results.push(add_branch_to_list(1, root_branch, true));
                    }
                    return _results;
                };
                scope.$watch('treeData', on_treeData_change, true);
                if (attrs.initialSelection != null) {
                    for_each_branch(function(b) {
                        if (b.label === attrs.initialSelection) {
                            return $timeout(function() {
                                return select_branch(b);
                            });
                        }
                    });
                }
                n = scope.treeData.length;
                //console.log('num root branches = ' + n);
                for_each_branch(function(b, level) {
                    b.level = level;
                    return b.expanded = b.level < expand_level;
                });
                if (scope.treeControl != null) {
                    if (angular.isObject(scope.treeControl)) {
                        tree = scope.treeControl;
                        tree.expand_all = function() {
                            return for_each_branch(function(b, level) {
                                return b.expanded = true;
                            });
                        };
                        tree.collapse_all = function() {
                            return for_each_branch(function(b, level) {
                                return b.expanded = false;
                            });
                        };
                        tree.get_first_branch = function() {
                            n = scope.treeData.length;
                            if (n > 0) {
                                return scope.treeData[0];
                            }
                        };
                        tree.select_first_branch = function() {
                            var b;
                            b = tree.get_first_branch();
                            return tree.select_branch(b);
                        };
                        tree.get_selected_branch = function() {
                            return selected_branch;
                        };
                        tree.get_parent_branch = function(b) {
                            return get_parent(b);
                        };
                        tree.select_branch = function(b) {
                            select_branch(b);
                            return b;
                        };
                        tree.get_children = function(b) {
                            return b.children;
                        };
                        tree.select_parent_branch = function(b) {
                            var p;
                            if (b == null) {
                                b = tree.get_selected_branch();
                            }
                            if (b != null) {
                                p = tree.get_parent_branch(b);
                                if (p != null) {
                                    tree.select_branch(p);
                                    return p;
                                }
                            }
                        };
                        tree.add_branch = function(parent, new_branch) {
                            if (parent != null) {
                                parent.children.push(new_branch);
                                parent.expanded = true;
                            } else {
                                scope.treeData.push(new_branch);
                            }
                            return new_branch;
                        };
                        tree.add_root_branch = function(new_branch) {
                            tree.add_branch(null, new_branch);
                            return new_branch;
                        };
                        tree.expand_branch = function(b) {
                            if (b == null) {
                                b = tree.get_selected_branch();
                            }
                            if (b != null) {
                                b.expanded = true;
                                return b;
                            }
                        };
                        tree.collapse_branch = function(b) {
                            if (b == null) {
                                b = selected_branch;
                            }
                            if (b != null) {
                                b.expanded = false;
                                return b;
                            }
                        };
                        tree.get_siblings = function(b) {
                            var p, siblings;
                            if (b == null) {
                                b = selected_branch;
                            }
                            if (b != null) {
                                p = tree.get_parent_branch(b);
                                if (p) {
                                    siblings = p.children;
                                } else {
                                    siblings = scope.treeData;
                                }
                                return siblings;
                            }
                        };
                        tree.get_next_sibling = function(b) {
                            var i, siblings;
                            if (b == null) {
                                b = selected_branch;
                            }
                            if (b != null) {
                                siblings = tree.get_siblings(b);
                                n = siblings.length;
                                i = siblings.indexOf(b);
                                if (i < n) {
                                    return siblings[i + 1];
                                }
                            }
                        };
                        tree.get_prev_sibling = function(b) {
                            var i, siblings;
                            if (b == null) {
                                b = selected_branch;
                            }
                            siblings = tree.get_siblings(b);
                            n = siblings.length;
                            i = siblings.indexOf(b);
                            if (i > 0) {
                                return siblings[i - 1];
                            }
                        };
                        tree.select_next_sibling = function(b) {
                            var next;
                            if (b == null) {
                                b = selected_branch;
                            }
                            if (b != null) {
                                next = tree.get_next_sibling(b);
                                if (next != null) {
                                    return tree.select_branch(next);
                                }
                            }
                        };
                        tree.select_prev_sibling = function(b) {
                            var prev;
                            if (b == null) {
                                b = selected_branch;
                            }
                            if (b != null) {
                                prev = tree.get_prev_sibling(b);
                                if (prev != null) {
                                    return tree.select_branch(prev);
                                }
                            }
                        };
                        tree.get_first_child = function(b) {
                            var _ref;
                            if (b == null) {
                                b = selected_branch;
                            }
                            if (b != null) {
                                if (((_ref = b.children) != null ? _ref.length : void 0) > 0) {
                                    return b.children[0];
                                }
                            }
                        };
                        tree.get_closest_ancestor_next_sibling = function(b) {
                            var next, parent;
                            next = tree.get_next_sibling(b);
                            if (next != null) {
                                return next;
                            } else {
                                parent = tree.get_parent_branch(b);
                                return tree.get_closest_ancestor_next_sibling(parent);
                            }
                        };
                        tree.get_next_branch = function(b) {
                            var next;
                            if (b == null) {
                                b = selected_branch;
                            }
                            if (b != null) {
                                next = tree.get_first_child(b);
                                if (next != null) {
                                    return next;
                                } else {
                                    next = tree.get_closest_ancestor_next_sibling(b);
                                    return next;
                                }
                            }
                        };
                        tree.select_next_branch = function(b) {
                            var next;
                            if (b == null) {
                                b = selected_branch;
                            }
                            if (b != null) {
                                next = tree.get_next_branch(b);
                                if (next != null) {
                                    tree.select_branch(next);
                                    return next;
                                }
                            }
                        };
                        tree.last_descendant = function(b) {
                            var last_child;
                            if (b == null) {
                                debugger;
                            }
                            n = b.children.length;
                            if (n === 0) {
                                return b;
                            } else {
                                last_child = b.children[n - 1];
                                return tree.last_descendant(last_child);
                            }
                        };
                        tree.get_prev_branch = function(b) {
                            var parent, prev_sibling;
                            if (b == null) {
                                b = selected_branch;
                            }
                            if (b != null) {
                                prev_sibling = tree.get_prev_sibling(b);
                                if (prev_sibling != null) {
                                    return tree.last_descendant(prev_sibling);
                                } else {
                                    parent = tree.get_parent_branch(b);
                                    return parent;
                                }
                            }
                        };
                        return tree.select_prev_branch = function(b) {
                            var prev;
                            if (b == null) {
                                b = selected_branch;
                            }
                            if (b != null) {
                                prev = tree.get_prev_branch(b);
                                if (prev != null) {
                                    tree.select_branch(prev);
                                    return prev;
                                }
                            }
                        };
                    }
                }
            }
        };
    }
])
.factory('DFXMobile', function () {
    var is_preview = sessionStorage.dfx_appname == '_preview';

    var openWidget = function (widget_name) {
        if (! is_preview) {
            var currentUrl = document.location.href;
            var baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
            var newUrl = baseUrl + '/' + widget_name + '.html';
            window.location.href = newUrl;
        } else {
            if (widget_name) {
                var currentWidget = $('[dfx-renderrer]').attr('name');
                var newPath = window.location.pathname.replace(currentWidget, widget_name);
                var newUrl =  window.location.href.replace(window.location.pathname, newPath);
                window.location.href = newUrl;
            }
        }
    };
    return {
        openWidget: openWidget
    };
})
.factory('DFXWeb', ['$rootScope', '$compile', function ($rootScope, $compile) {
    /**
     * Service function to be called by developer to open a dialog box in application run time.
     * Choose only one between options.html and options.widgetName parameters.
     *
     * IMPORTANT: if you open a widget in popup, it must be deployed first!
     *
     * Options top/left/width/height can take values in pixels or percentages.
     *
     * Possible options.headerColor values are: [white, green,  greenDark,  greenLight,  purple, magenta, pink, pinkDark,
     *                                  teal, blue, blueLight, blueDark, darken, yellow, orange, orangeDark, red, redLight].
     * Default options.headerColor is blueDark.
     *
     * To center dialog window, do not assign any values to options.top and options.left.
     *
     * Examples:
     * 1) Show widget wForm in the dialog window and center it in the screen:
     DFXWeb.openDialog({
        'title': 'My Dialog Form',
        'width': '50%',
        'height': '50%',
        'widgetName': 'wForm',
        'buttons': 'YES_NO_CANCEL',
        'callback': dialogCallback
     });
     2) Show HTML content in the dialog window:
     DFXWeb.openDialog({
        'title': 'My Html Content',
        'headerColor': 'orange',
        'top': '100px',
        'left': '25%',
        'width': '400px',
        'height': '200px',
        'html': '<p>Open dialog HTML content, paragraph 1</p><p>Open dialog HTML content, paragraph 2</p>',
        'buttons': 'OK_CANCEL'
     });
     *
     * @param options object, with structure
     *      {title, headerColor, top, left, width, height, html, widgetName, buttons, callback}
     *       where buttons can have values: YES_NO, YES_NO_CANCEL, OK_CANCEL, YES, NO, OK, CANCEL
     *       and where callback is a function that takes clicked button as parameter (yes, no, ok, cancel)
     */
    var openDialog = function (options) {
        var calcPosition = function () {
            var result = '';
            if ((!options.top) && (!options.left)) {// center dialog horizontally and vertically
                var getCss = function (propValue, propName) {
                    if (propValue.indexOf('px') > -1) {
                        var value = parseInt(propValue.substring(0, propValue.indexOf('px'))) / 2;
                        return propName + ': 50%; margin-' + propName + ': -' + value + 'px;';
                    } else if (propValue.indexOf('%') > -1) {
                        var value = parseInt(propValue.substring(0, propValue.indexOf('%'))) / 2;
                        return propName + ': ' + (50 - value) + '%;';
                    }
                };
                result += getCss(options.width, 'left');// 'left: 50%; margin-left: -100px;' or 'left: 25%;'
                result += getCss(options.height, 'top');// 'top: 50%; margin-top: -100px;' or 'top: 25%;'
            } else {
                result += 'top: ' + options.top + ';' + 'left: ' + options.left + ';';
            }
            return result;
        };

        var createDialogHtml = function (buttonNames, dialogBodyContent) {
            var dialogStyle =
                '<style>' +
                '.dfx_dialog_black_overlay {' +
                'display: block;' +
                'position: absolute;' +
                'top: 0%;' +
                'left: 0%;' +
                'width: 100%;' +
                'height: 100%;' +
                'z-index:1001;' +
                '}' +
                '.dfx_dialog_white_content {' +
                'display: block;' +
                'position: absolute;' +
                calcPosition() +
                'width: ' + options.width + ';' +
                'height: ' + options.height + ';' +
                'padding: 0px;' +
                'border: 1px solid black;' +
                'background-color: white;' +
                'z-index:1002;' +
                'overflow: hidden;' +
                '}' +
                '</style>';

            var closeAction =
                'document.getElementById(\'dfx_dialog_light\').style.display=\'none\';' +
                'document.getElementById(\'dfx_dialog_fade\').style.display=\'none\';' +
                '$(\'#dfx_dialog_container\').remove();';

            var buttonsHtml = '';
            for (var i = (buttonNames.length - 1); i >= 0; i--) {
                var buttonTitle = buttonNames[i].charAt(0).toUpperCase() + buttonNames[i].toLowerCase().slice(1);
                buttonsHtml += '<button id="dfx_dialog_' + buttonNames[i].toLowerCase() + '" type="button" class="btn btn-default btn-sm botTempo">' + buttonTitle + '</button>';
            }

            var dialogHeaderColor = (options.headerColor) ? 'jarviswidget-color-' + options.headerColor : 'jarviswidget-color-blueDark';
            var dialogBodyBottom = (buttonsHtml) ? '44px;' : '0px;';//buttons bar height is 45px, and we have to put 45-1=44 to hide horizontal grey line coming from bg
            var dialogHtml =
                '<div id="dfx_dialog_light" class="dfx_dialog_white_content divMessageBox animated fadeIn fast jarviswidget jarviswidget-sortable ' + dialogHeaderColor + '">' +
                '<header style="display:block; position: absolute; top: 0px; left: 0px; right: 0px; height: 34px; margin: 0px;">' +
                '<div class="row jarviswidget-ctrls" style="width:100%;">' +
                '<h2 class="pull-left" style="margin-left: 14px;">' + (options.title || '') + '</h2>' +
                '<a href = "javascript:void(0)" onclick = "' + closeAction + '" class="button-icon jarviswidget-delete-btn pull-right">' +
                '<i class="fa fa-times"></i>' +
                '</a>' +
                '</div>' +
                '</header>' +
                '<div class="row" style="position: absolute; top: 34px; bottom: ' + dialogBodyBottom + 'left: 0px; right: 0px; overflow-y: auto;">' +
                dialogBodyContent +
                '</div>';
            dialogHtml += (!buttonsHtml) ? '' :
            '<div class="row" style="position: absolute; bottom: 0px; left: 0px; right: 0px; padding:5px; margin: 0px;">' +
            '<div class="MessageBoxButtonSection">' +
            buttonsHtml +
            '</div>' +
            '</div>';
            dialogHtml +=
                '</div>' +
                '<div id="dfx_dialog_fade" class="dfx_dialog_black_overlay divMessageBox animated fadeIn fast"></div>';

            return '<div id="dfx_dialog_container">' + dialogStyle + dialogHtml + '</div>';
        };

        var createDialogButtonsHandlers = function (buttonNames) {
            for (var i = 0; i < buttonNames.length; i++) {
                var createButtonHandler = function (buttonName) {
                    $('#dfx_dialog_' + buttonName.toLowerCase()).on('click', function () {
                        document.getElementById('dfx_dialog_light').style.display = 'none';
                        document.getElementById('dfx_dialog_fade').style.display = 'none';
                        $('#dfx_dialog_container').remove();

                        if (options.callback) options.callback(buttonName.toLowerCase());
                    });
                };
                createButtonHandler(buttonNames[i]);
            }
        };

        var runDialog = function () {
            var buttonNames = (options.buttons) ? options.buttons.split('_') : [];

            // if this is preview, construct the variable to include widget template and assign it to the scope
            if ($rootScope) {
                $rootScope['widget_template_' + options.widgetName] = '/widgets/' + sessionStorage.dfx_tenantid + '/' + options.widgetName + '.html';
            }

            var dialogBodyContent = (options.widgetName)
                ? '<div ng-include="widget_template_' + options.widgetName + '" dfx-include-replace></div>'
                : options.html;

            var openDialogHtml = createDialogHtml(buttonNames, dialogBodyContent);

            var element = angular.element(openDialogHtml);
            if (options.widgetName) {
                $compile(element.contents())($rootScope);
            }
            if ($('#dfx_dialog_container').length == 0) {
                element.appendTo("body");
            }

            createDialogButtonsHandlers(buttonNames);
        };

        runDialog();
    };
    return {
        openDialog: openDialog
    };
}]);
/*
 This notice must be untouched at all times.

 DreamFace DFX
 Version: 3.0.0
 Author: Interactive Clouds

 Copyright (c) 2015 Interactive Clouds, Inc.  "DreamFace" is a trademark of Interactive Clouds, Inc.

 LICENSE: DreamFace Open License
 */

var IS_STUDIO = false,
    $user = {},
    dfx_app_conf = null;

var DreamFace = function(options) {
    $('[dfx-renderrer]').each( function(i) {
        var element_name = $(this).attr('name');
        var fct = new Function( 'return ' + element_name + '_eventHandler();' );
        fct();
    });
    
    
    $('[df-data-query]').each( function(i) {
        var df_component_type = $(this).prop( 'tagName' );
        if (df_component_type=='UL') {
            DreamFace.initGCListView( this );
        }
    });
};

DreamFace.initSession = function( options ) {
    if (options.dfx_server==null) {
        sessionStorage.dfx_server = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port;
    } else {
        sessionStorage.dfx_server = options.dfx_server;
    }
    sessionStorage.dfx_tenantid = options.dfx_tenantid;
    sessionStorage.dfx_appname = options.dfx_appname;
    sessionStorage.dfx_ispreview = options.dfx_ispreview;
    sessionStorage.dfx_appcontext = {};
};

DreamFace.getSession = function(){
    return sessionStorage;
};

DreamFace.get = function( options ) {
    $.ajax({
            type: 'GET',
            url: sessionStorage.dfx_server + '/dfx/' + sessionStorage.dfx_tenantid + '/' + sessionStorage.dfx_appname + '/' + options.url,
            data: options.data,
            success: function(data) {
                options.callback( null, data );
            },
            error: function(jqXHR, textStatus, errorThrown) {
                options.callback( errorThrown );
            }
    });
};    

DreamFace.post = function( options ) {
    var ajax = {
            type: 'POST',
            url: sessionStorage.dfx_server + '/dfx/' + sessionStorage.dfx_tenantid + '/' + sessionStorage.dfx_appname + '/' + options.url,
            data: options.data,
            success: function(data) {
                options.callback( null, data );
            },
            error: function(jqXHR, textStatus, errorThrown) {
                options.callback( errorThrown );
            }
    };

    $.ajax(ajax);
};

DreamFace.setAppContext = function( options ) {
    // TODO
};

DreamFace.getAppContext = function (name) {
    // TODO
};

DreamFace.setUserDefinition = function () {
    $user = sessionStorage.dfx_user ? JSON.parse( sessionStorage.dfx_user ) : {};
    dfx_app_conf = sessionStorage.dfx_app_conf ? JSON.parse( sessionStorage.dfx_app_conf ) : null;
};

DreamFace.openDialog = function( options ) {
    $.mobile.changePage( 'dialog', {
        data: 'text=test',
        transition: 'pop',
        reverse: false,
        changeHash: false
    });
};


/*
    DreamFace Graphical Components
*/

DreamFace.initGCListView = function( comp ) {
    var name = $(comp).attr( "df-data-query" );
    var path = $(comp).attr( "df-data-query-path" );
    var load = ($(comp).attr( "df-data-query-load" )=='true') ? true : false;
    
    var data_query = new DataQuery(name);
    data_query.execute();
};

/*
     DreamFace Menus
 */

DreamFace.getMenu = function( name, caller_callback ) {
    authRequest( {
        type: 'GET',
        url: '/app/menu/' + sessionStorage.dfx_tenantid + '/' + sessionStorage.dfx_appname + '/' + name
    }).then(function(data){
        caller_callback(data)
    });
};

// former jquery plugin
(function( $ ){

    var methods = {
        init : function(options) {
            /*$("dfx-widget[wclass]").each( function(i) {
                var dfx_widget = this;
                var dfx_widget_id = $(this).attr("id");
                var wclass_value = $(dfx_widget).attr( "wclass" );
                $.get('widget.html?wclass='+wclass_value, function(data) {
                    $(dfx_widget).replaceWith( data );
                    $("a[data-role='button']").button();
                    var widget_initializer = new Function("return " + dfx_widget_id + "_eventHandler();");
                    widget_initializer();
                });
            });*/
        }
    };

    $.fn.dreamface = function(methodOrOptions) {
        if ( methods[methodOrOptions] ) {
            return methods[ methodOrOptions ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof methodOrOptions === 'object' || ! methodOrOptions ) {
            // Default to "init"
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.dreamface' );
        }    
    };


})( jQuery );



var dfxSystemModules = ['ngRoute', 'ngMaterial', 'dfxGControls', 'dfxAppServices', 'dfxStudioApi', 'nvd3'];
if (typeof dfxAppRuntimeModules != 'undefined')
    dfxSystemModules = dfxSystemModules.concat(dfxAppRuntimeModules);
var dfxAppRuntime = angular.module('dfxAppRuntime', dfxSystemModules);

dfxAppRuntime
    .config( function($routeProvider) {
        $routeProvider
        .when('/page.html', {
            controller: 'dfx_page_controller',
            templateUrl: 'page.html'
        })
        .otherwise({
            redirectTo: '/page.html'
        });
    })
    .config( function($mdThemingProvider) {
        $mdThemingProvider.theme('altTheme')
        .primaryPalette('blue')
        $mdThemingProvider.setDefaultTheme('altTheme');
    });

dfxAppRuntime.controller('dfx_login_controller', [ '$scope', '$rootScope', function( $scope, $rootScope) {
    $scope.uid = '';
    $scope.pwd = '';

    $scope._dfx_server = sessionStorage.dfx_server;

    sessionStorage.setItem( 'applicationToken', '' );

    $('#username').focus();

    /*$scope.login = function() {
        $http({
            method: 'POST',
            url: sessionStorage.dfx_server + '/app/login',
            data: {
                tenantid  : sessionStorage.dfx_tenantid,
                appid     : sessionStorage.dfx_appname,
                ispreview : sessionStorage.dfx_ispreview,
                userid    : $scope.uid
            }
        }).then(function successCallback(response) {

        });
    };*/
}]);

dfxAppRuntime.controller('dfx_app_controller', [ '$scope', '$rootScope', 'dfxAuthRequest', '$q', '$http', '$compile', 'dfxPages', function( $scope, $rootScope, dfxAuthRequest, $q, $http, $compile, dfxPages) {
	$scope.app_name = $('body').attr('dfx-app');
    $scope.platform = $('body').attr('dfx-platform');
    $scope.gc_types = {};
    $scope.page_name = 'Home';
    $scope.app_user = $user;

    $scope.design_devices = [
        {
            'name':     'iphone5',
            'label':    '320x568 (Apple iPhone 5)',
            'portrait' : {
                'image':  'iphone_5_320x568.png',
                'width':  '376px',
                'height': '794px',
                'padding-top': '110px',
                'padding-left': '30px',
                'padding-right': '30px',
                'padding-bottom': '120px'
            },
            'landscape': {
                'image':  'iphone_5_landscape_320x568.png',
                'width':  '794px',
                'height': '376px',
                'padding-top': '30px',
                'padding-left': '110px',
                'padding-right': '120px',
                'padding-bottom': '30px'
            }
        },
        {
            'name':     'iphone6',
            'label':    '375x667 (Apple iPhone 6)',
            'portrait' : {
                'image':  'iphone_6_375x667.png',
                'width':  '432px',
                'height': '880px',
                'padding-top': '109px',
                'padding-left': '31px',
                'padding-right': '30px',
                'padding-bottom': '30px'
            },
            'landscape': {
                'image':  'iphone_6_landscape_375x667.png',
                'width':  '880px',
                'height': '432px',
                'padding-top': '30px',
                'padding-left': '109px',
                'padding-right': '108px',
                'padding-bottom': '30px'
            }
        },
        {
            'name':     'iphone6plus',
            'label':    '414x736 (Apple iPhone 6+)',
            'portrait' : {
                'image':  'iphone_6plus_414x736.png',
                'width':  '471px',
                'height': '955px',
                'padding-top': '103px',
                'padding-left': '31px',
                'padding-right': '30px',
                'padding-bottom': '30px'
            },
            'landscape': {
                'image':  'iphone_6plus_landscape_414x736.png',
                'width':  '955px',
                'height': '471px',
                'padding-top': '30px',
                'padding-left': '103px',
                'padding-right': '120px',
                'padding-bottom': '30px'
            }
        }
    ];
    $scope.design_selected_device = $scope.design_devices[0];
    $scope.design_device_orientation = 'Portrait';

    $scope.getGCDefaultAttributes = function( type ) {
        var deferred = $q.defer();
        if ($scope.gc_types[type] != null) {
            deferred.resolve( $scope.gc_types[type] );
        } else {
            $http.get( '/gcontrols/web/' + type + '.json' ).success( function(data) {
                $scope.gc_types[type] = data;
                deferred.resolve( data );
            });
        }
        return deferred.promise;
    }

    $scope.logout = function() {
        authRequest.removeToken();

    }
}]);

dfxAppRuntime.controller('dfx_page_controller', [ '$scope', '$rootScope', 'dfxAuthRequest', '$q', '$http', '$compile', '$routeParams', '$location', 'dfxPages', function( $scope, $rootScope, dfxAuthRequest, $q, $http, $compile, $routeParams, $location, dfxPages) {

    $scope.page_preview = false;
    $scope.page_name = ($routeParams.name) ? $routeParams.name : 'Home';

    if ($location.search().preview=='true') {
        $scope.page_preview = true;
    }

    $scope.loadPageDefinition = function() {
        if ($scope.page_preview) {
            $http({
                method: 'GET',
                url: '/studio/screen/item/' + $scope.page_name + '/' + $scope.app_name + '/' + 'web'
            }).then(function successCallback(response) {
                $scope.selected_page = response.data.screen;
                $scope.loadPageTemplate(response.data.screen.template);
            });
        } else {
            $http({
                method: 'GET',
                url: 'pages/' + $scope.page_name + '.json'
            }).then(function successCallback(request) {
                $scope.selected_page = request.data;
                $scope.loadPageTemplate(request.data.template);
            });
        }
    };

    $scope.loadPageTemplate = function(template) {
        /*dfxTemplates.getOne( $scope, $scope.app_name, template )
        .then( function(template) {
            $scope.selected_template = template;
            var snippet = '<div layout="column" flex dfx-page-template="' + template.name + '"></div>';
            $('#dfx_page_content').empty();
            angular.element(document.getElementById('dfx_page_content')).append($compile(snippet)($scope));
        });*/
        if ($scope.page_preview) {
            $http({
                method: 'GET',
                url: '/studio/screentemplates/item/' + template + '/' + $scope.app_name
            }).then(function successCallback(request) {
                $scope.selected_template = request.data.screenTemplate;
                var snippet = '<div layout="column" flex dfx-page-template="' + template + '"></div>';
                $('#dfx_page_content').empty();
                angular.element(document.getElementById('dfx_page_content')).append($compile(snippet)($scope));
            });
        } else {
            $http({
                method: 'GET',
                url: 'templates/' + template + '.json'
            }).then(function successCallback(request) {
                $scope.selected_template = request.data;
                var snippet = '<div layout="column" flex dfx-page-template="' + template + '"></div>';
                $('#dfx_page_content').empty();
                angular.element(document.getElementById('dfx_page_content')).append($compile(snippet)($scope));
            });
        }
    };

    $scope.routeToPage = function(page_name) {
        $location.search( 'name', page_name );
        //$scope.$apply();
    };

    $scope.toggleLeftSide = function() {
        if ($scope.selected_template.layout.left.display=='true') {
            $scope.selected_template.layout.left.display='false';
        } else {
            $scope.selected_template.layout.left.display='true';
        }
    };

    $scope.changeDevice = function(index) {
        $scope.design_selected_device = $scope.design_devices[index];
        $scope.refreshDevice();
    };

    $scope.loadPageDefinition();
}]);

dfxAppRuntime.controller('dfx_view_controller', [ '$scope', '$rootScope', '$compile', '$timeout', '$element', function($scope, $rootScope, $compile, $timeout, $element) {
    $scope.gc_instances = ($scope.gc_instances) ? $scope.gc_instances : {};
    $scope.$parent._view_id = $element.attr('id');

    $scope.view_platform = $element.attr('dfxVePlatorm');

    

    $scope.callViewControllerFunction = function( function_name, parameters ) {
        return $scope.gc_instances[$(element).attr('id')];
    };

    $scope.getComponent = function( element ) {
        var id = $(element).attr('id');
        if ($(element).attr('dfx-gc-renderer-content')!=null) {
            var component_id = $(element).parent().attr('component-id');
            var column_id = $(element).parent().attr('column-id');
            var row_id = $(element).parent().attr('row-id');
            var component = $scope.gc_instances[component_id].attributes.columns.value[column_id].renderer;
            component.id = component_id + '_renderer_' + row_id + '_' + column_id;
            return component;
        } else {
            return $scope.gc_instances[id];
        }
    };
    
    $scope.addComponents = function( components, container_component, parent_id, card, view_id ) {
        var idx = 0;
        var ref_components = (card!=null) ? components[card] : components;
        for (idx = 0; idx < ref_components.length; idx++) {
            var component = ref_components[idx];
            $scope.registerChildren( component );
            $scope.addComponent(component, container_component, parent_id, view_id);
        }
    };

    $scope.registerChildren = function( component ) {
        var idx_child = 0;
        for (idx_child = 0; idx_child < component.children.length; idx_child++) {
            $scope.gc_instances[component.children[idx_child].id] = component.children[idx_child];
            if (component.children[idx_child].children.length>0) {
                $scope.registerChildren(component.children[idx_child]);
            }
        }
    }

    // Add a component
    $scope.addComponent = function( component, container_component, parent_id, view_id) {
        var component_instance = $scope.renderGraphicalControl(component, parent_id, view_id);
        $timeout(function() {
        	if (component.container==null) {
        		$('#' + container_component.id).append(component_instance.fragment);
        	} else {
            	$('#' + container_component.id + '_' + component.container).append(component_instance.fragment);
            }
	    }, 0);
    };

    // Render GControls
    $scope.renderGraphicalControl = function( component, parent_id, view_id ) {
        $scope.gc_instances[component.id] = component;
        var gc_instance = {};
        var flex_container_attr = (component.attributes.flex!=null) ? ' flex="{{attributes.flex.value}}"' : '';

        var panel_layout = (component.type == 'panel' && (!component.attributes.autoHeight ||  component.attributes.autoHeight.value != true)) ? ' style="height:100%;" layout="column" ' : '';

        gc_instance.fragment = $compile(
            '<div id="' + component.id +
            '" dfx-gc-web-base dfx-gc-web-' + component.type +
            ' gc-role="control" gc-parent="' + parent_id +
            '" view-id="' + view_id +
            '"' + flex_container_attr +
            panel_layout +
            '></div>')($scope);
        gc_instance.id = component.id;
        return gc_instance;
    };

    $scope.refreshDevice = function() {
        if ($scope.design_device_orientation=='Portrait') {
            $('#dfx_view_preview_container').css('width', $scope.design_selected_device.portrait['width']);
            $('#dfx_view_preview_container').css('height', $scope.design_selected_device.portrait['height']);
            $('#dfx_view_preview_container').css('padding-top', $scope.design_selected_device.portrait['padding-top']);
            $('#dfx_view_preview_container').css('padding-left', $scope.design_selected_device.portrait['padding-left']);
            $('#dfx_view_preview_container').css('padding-right', $scope.design_selected_device.portrait['padding-right']);
            $('#dfx_view_preview_container').css('padding-bottom', $scope.design_selected_device.portrait['padding-bottom']);
            $('#dfx_view_preview_container').css( 'background', 'url(/images/' + $scope.design_selected_device.portrait['image'] + ') no-repeat' );
        } else {
            $('#dfx_view_preview_container').css('width', $scope.design_selected_device.landscape['width']);
            $('#dfx_view_preview_container').css('height', $scope.design_selected_device.landscape['height']);
            $('#dfx_view_preview_container').css('padding-top', $scope.design_selected_device.landscape['padding-top']);
            $('#dfx_view_preview_container').css('padding-left', $scope.design_selected_device.landscape['padding-left']);
            $('#dfx_view_preview_container').css('padding-right', $scope.design_selected_device.landscape['padding-right']);
            $('#dfx_view_preview_container').css('padding-bottom', $scope.design_selected_device.landscape['padding-bottom']);
            $('#dfx_view_preview_container').css( 'background', 'url(/images/' + $scope.design_selected_device.landscape['image'] + ') no-repeat' );
        }
    };

    $scope.changeDevice = function(index) {
        $scope.design_selected_device = $scope.design_devices[index];
        $scope.refreshDevice();
    };

    $scope.changeDeviceOrientation = function() {
        $scope.design_device_orientation = ($scope.design_device_orientation=='Portrait') ? 'Landscape' : 'Portrait';
        $scope.refreshDevice();
    };


}]);

dfxAppRuntime.directive( 'dfxPageIncludeTemplate', function($compile) {
    return{
        restrict: 'A',
        link: function(scope, element, attributes) {
            scope.$watch('selected_template.layout.' + attributes.dfxPageIncludeTemplate + '.content.value', function(new_value) {
                element.html(new_value); 
                $compile(element.contents())(scope);
            });
        }
    }
});

dfxAppRuntime.directive('dfxPageTemplate', ['$compile', '$mdSidenav', function($compile, $mdSidenav) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            var tpl_snippet = '';

            // Header
            tpl_snippet = '<div layout="row" ng-show="selected_template.layout.header.display==\'true\'" style="min-height:{{selected_template.layout.header.height}}"><div layout layout-align="{{selected_template.layout.header.halignment}} {{selected_template.layout.header.valignment}}" flex="100" style="height:{{selected_template.layout.header.height}};{{selected_template.layout.header.style}}" dfx-page-include-template="header"></div></div>';

            // Middle Section Start
            tpl_snippet += '<div layout="row" flex layout-fill style="overflow:auto;{{selected_template.layout.body.style}}">';
            
            // Left
            tpl_snippet += '<div id="dfxpageleft" ng-show="selected_template.layout.left.display==\'true\'" style="width:{{selected_template.layout.left.width}};{{selected_template.layout.left.style}}" class="{{selected_template.layout.left.whiteframe}}"><md-content layout layout-align="{{selected_template.layout.left.halignment}} {{selected_template.layout.left.valignment}}" style="background:inherit" dfx-page-include-template="left"></md-content></div>';

            // Body
            tpl_snippet += '<div layout="column" style="background:inherit;overflow:auto" layout-padding flex id="pagebody">';
            
            tpl_snippet += '<div layout="row" flex="{{row.autoHeight != true ? row.height : \'\'}}" style="" ng-repeat="row in selected_page.layout.rows">';
            tpl_snippet += '<div layout="column" flex="{{col.width}}" data-row="{{$parent.$index}}" data-column="{{$index}}" ng-repeat="col in row.columns" style="padding:5px">';
            tpl_snippet += '<div layout="column" flex ng-repeat="view in col.views">';
            tpl_snippet += '<div id="wrapper" dfx-view-wrapper="view.name" dfx-view-wrapper-id="view.id" flex layout="column">';
            tpl_snippet += '</div>';
            tpl_snippet += '</div>';
            tpl_snippet += '</div>';
            tpl_snippet += '</div>';

            tpl_snippet += '</div>';
            
            // Right
            tpl_snippet += '<div id="dfxpageright" ng-show="selected_template.layout.right.display==\'true\'" style="width:{{selected_template.layout.right.width}};{{selected_template.layout.right.style}}" class="{{selected_template.layout.right.whiteframe}}"><md-content layout layout-align="{{selected_template.layout.right.halignment}} {{selected_template.layout.right.valignment}}" style="background:inherit" dfx-page-include-template="right"></md-content></div>';

            // Middle Section End
            tpl_snippet += '</div>';

            // Footer
            tpl_snippet += '<div layout="row" ng-show="selected_template.layout.footer.display==\'true\'" style="min-height:{{selected_template.layout.footer.height}}"><div layout layout-align="{{selected_template.layout.footer.halignment}} {{selected_template.layout.header.valignment}}" flex="100" style="height:{{selected_template.layout.footer.height}};{{selected_template.layout.footer.style}}" dfx-page-include-template="footer"></div></div>';

            $element.append($compile(tpl_snippet)($scope));
        }
    }
}]);

dfxAppRuntime.filter("sanitize", ['$sce', function($sce) {
    return function(htmlCode){
        return $sce.trustAsHtml(htmlCode);
    }
}]);

dfxAppRuntime.directive('dfxViewPreview', function() {
	return {
    	restrict: 'A',
        controller: function($scope, $element, $attrs) {
                $scope.view_id = $attrs.id;
                $scope.$parent.dfxViewCard = $attrs.dfxViewCard;
                var widget_definition = JSON.parse(window.localStorage.getItem( 'dfx_' + $attrs.dfxViewPreview ));
                $scope.$watch('dfxViewCard', function() {
                    angular.element($('#dfx_view_preview_container')).html('');
                    $scope.addComponents( widget_definition.definition, { "id": "dfx_view_preview_container" }, '', $scope.dfxViewCard, 'dfx_view_preview_container' );
                });
        }
    }
});

dfxAppRuntime.directive('dfxViewPreviewInDialog', [ '$http', function( $http ) {
    return {
        restrict: 'A',
        controller: function($scope, $element, $attrs) {
            var view_object = $('#' + $scope.$parent._view_id)[0];
            var component_id = $('div:first',view_object).attr('id');
            var widget_definition = window.localStorage.getItem('dfx_' + $attrs.dfxViewPreviewInDialog);
            if (widget_definition) {
                $scope.addComponents( JSON.parse(widget_definition).definition, { "id": "dfx_view_preview_container_in_dialog_" + component_id  }, '', $attrs.dfxCard, 'dfx_view_preview_container_in_dialog_' + component_id  );
            } else {
                $http.get('views/' + $attrs.dfxViewPreviewInDialog + '.json').then(function (response) {
                    $scope.addComponents( JSON.parse(response.data.src).definition, { "id": "dfx_view_preview_container_in_dialog_" + component_id  }, '', $attrs.dfxCard, 'dfx_view_preview_container_in_dialog_' + component_id  );
                }, function (err) {
                    console.log("Can't get view " + $attrs.dfxViewPreviewInDialog + " defintion");
                });
            }
        }
    }
}]);

dfxAppRuntime.directive('dfxViewPreviewInSidenav', [ '$http', function( $http ) {
    return {
        restrict: 'A',
        controller: function($scope, $element, $attrs) {
            var view_object = $('#' + $scope.$parent._view_id)[0];
            var component_id = $('div:first',view_object).attr('id');
            var widget_definition = window.localStorage.getItem('dfx_' + $attrs.dfxViewPreviewInSidenav);
            if (widget_definition) {
                $scope.addComponents( JSON.parse(widget_definition).definition, { "id": "dfx_view_preview_container_in_sidenav_" + component_id }, '', $attrs.dfxCard, 'dfx_view_preview_container_in_sidenav_' + component_id );
            } else {
                $http.get('views/' + $attrs.dfxViewPreviewInSidenav + '.json').then(function (response) {
                    $scope.addComponents( JSON.parse(response.data.src).definition, { "id": "dfx_view_preview_container_in_sidenav_" + component_id }, '', $attrs.dfxCard, 'dfx_view_preview_container_in_sidenav_' + component_id );
                }, function (err) {
                    console.log("Can't get view " + $attrs.dfxViewPreviewInSidenav + " defintion");
                });
            }
        }
    }
}]);

dfxAppRuntime.directive('dfxViewPreviewInBottom', [ '$http', function( $http ) {
    return {
        restrict: 'A',
        controller: function($scope, $element, $attrs) {
            var view_object = $('#' + $scope.$parent._view_id)[0];
            var component_id = $('div:first',view_object).attr('id');
            var widget_definition = window.localStorage.getItem('dfx_' + $attrs.dfxViewPreviewInBottom);
            if (widget_definition) {
                $scope.addComponents( JSON.parse(widget_definition).definition, { "id": "dfx_view_preview_container_in_bottom_" + component_id  }, '', $attrs.dfxCard, 'dfx_view_preview_container_in_bottom_' + component_id  );
            } else {
                $http.get('views/' + $attrs.dfxViewPreviewInBottom + '.json').then(function (response) {
                    $scope.addComponents( JSON.parse(response.data.src).definition, { "id": "dfx_view_preview_container_in_bottom_" + component_id  }, '', $attrs.dfxCard, 'dfx_view_preview_container_in_bottom_' + component_id  );
                }, function (err) {
                    console.log("Can't get view " + $attrs.dfxViewPreviewInBottom + " defintion");
                });
            }
        }
    }
}]);

dfxAppRuntime.directive('dfxViewPreviewWithCard', [ '$http', function( $http ) {
    return {
        restrict: 'A',
        controller: function($scope, $element, $attrs) {
            var view_object = $('#' + $scope.$parent._view_id)[0];
            var component_id = $('div:first',view_object).attr('id');
            var widget_definition = window.localStorage.getItem('dfx_' + $attrs.dfxViewPreviewWithCard);
            if (widget_definition) {
                $scope.addComponents( JSON.parse(widget_definition).definition, { "id": "dfx_view_preview_with_card_content_" + component_id  }, '', $attrs.dfxCard, 'dfx_view_preview_with_card_content_' + component_id  );
            } else {
                $http.get('views/' + $attrs.dfxViewPreviewWithCard + '.json').then(function (response) {
                    $scope.addComponents( JSON.parse(response.data.src).definition, { "id": "dfx_view_preview_with_card_content_" + component_id  }, '', $attrs.dfxCard, 'dfx_view_preview_with_card_content_' + component_id  );
                }, function (err) {
                    console.log("Can't get view " + $attrs.dfxViewPreviewInBottom + " defintion");
                });
            }
        }
    }
}]);

dfxAppRuntime.directive('dfxViewWrapper', [ '$http', '$compile', function($http, $compile) {
    return {
        restrict: 'A',
        scope: {
          wrapper_view_name: '=dfxViewWrapper',
          wrapper_view_id: '=dfxViewWrapperId'
        },
        priority: 100000,
        link: function($scope, $element, $attrs) {
            var wrapper_snippet = '<div id="' + $scope.wrapper_view_id + '" dfx-view="' + $scope.wrapper_view_name + '" dfx-view-card="default" ng-controller="dfx_view_controller" style="width:100%" layout="column" flex></div>';
            $element.attr('ng-controller', $scope.wrapper_view_name + 'Controller');
            $element.append(wrapper_snippet);
            $element.removeAttr('dfx-view-wrapper');
            $element.attr('id', $scope.wrapper_view_id + '-wrapper');
            var page_scope = $scope.$parent.$parent.$parent.$parent;
            if (page_scope.page_preview) {
                $.getScript( '/studio/widget/script/' + page_scope.$parent.app_name + '/' + $scope.wrapper_view_name + '/' + page_scope.$parent.platform )
                    .done(function( script, textStatus ) {
                        $compile($element)($scope);
                    })
            } else {
                $compile($element)($scope);
            }
        }
    }
}]);

dfxAppRuntime.directive('dfxView', [ '$http', '$timeout', function($http, $timeout) {
	return {
    	restrict: 'A',
        controller: function($scope, $element, $attrs) {
        	$timeout( function() {
                $scope.view_id = $attrs.id;
                $scope.$parent.view_id = $attrs.id;
                $scope.$parent.dfxViewCard = $attrs.dfxViewCard;
                $scope.$watch('dfxViewCard', function() {
                    angular.element($('#' + $scope.view_id)).html('');
                    var page_scope = $scope.$parent.$parent.$parent.$parent;
                    if (page_scope && page_scope.page_preview) {
                        $http.get( '/studio/widget/item/' + page_scope.$parent.app_name + '/' + $attrs.dfxView + '/' + page_scope.$parent.platform ).success(function(response) {
                            $scope.addComponents( (JSON.parse(response.src)).definition, { "id": $scope.view_id }, '', $scope.dfxViewCard, $scope.view_id );
                        });
                    } else {
                        $http.get( 'views/' + $attrs.dfxView + '.json' ).success(function(response) {
                            $scope.addComponents( (JSON.parse(response.src)).definition, { "id": $scope.view_id }, '', $scope.dfxViewCard, $scope.view_id );
                        });
                    }
                });
            }, 0);
        }
    }
}]);

dfxAppRuntime.directive('dfxGcWeb', ['$compile', function($compile) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            var component = $scope.gc_instances[$attrs.id];

            if ( component.attributes.repeat_title && component.attributes.repeat_title.value ) {
                var inherited = {
                    "halignment": $scope.$parent.col.halignment.value,
                    "orientation": $scope.$parent.col.orientation.value,
                    "valignment": $scope.$parent.col.valignment.value,
                    "width": $scope.$parent.col.width.value
                };
                var panel_height = (component.type == 'panel' && (!component.attributes.autoHeight ||  component.attributes.autoHeight.value != true)) ? ' height:100%;' : '';
                var ifLayout = ( $scope.$parent.col.orientation.value === 'row' ) ? ' layout="row" style="flex-wrap: wrap;' : ' style="width:100%;max-height:100%;flex-direction: column;display: flex;';
                ifLayout = ifLayout + panel_height + '"';
                var angular_snippet = $compile(
                    '<div id="'+$attrs.id+
                    '" dfx-gc-web-base dfx-gc-web-'+$attrs.dfxGcWeb+
                    ' gc-role="control" gc-parent="'+$attrs.gcParent+
                    '" view-id="'+$attrs.viewId+
                    '" flex="100"' +
                    ifLayout +
                    '" layout-align="' + inherited.halignment + ' ' + inherited.valignment +
                    '"></div>')($scope);
            } else {
                var flex_container_attr = (component.attributes.flex!=null) ? ' flex="{{attributes.flex.value}}"' : '';
                var panel_layout = (component.type == 'panel' && (!component.attributes.autoHeight ||  component.attributes.autoHeight.value != true)) ? ' style="height:100%;" ' : '';
                var angular_snippet = $compile('<div id="'+$attrs.id+'" dfx-gc-web-base dfx-gc-web-'+$attrs.dfxGcWeb+' gc-role="control" gc-parent="'+$attrs.gcParent+'" view-id="'+$attrs.viewId+'"' + flex_container_attr + panel_layout + '></div>')($scope);
            }
            $element.replaceWith(angular_snippet);
        }
    }
}]);

dfxAppRuntime.directive('dfxGcRenderer', ['$compile', function($compile) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            var viewId = $('#'+$attrs.componentId).attr('view-id');
            var angular_snippet = $compile('<div id="'+$attrs.componentId+'_renderer_'+$attrs.rowId+'_'+$attrs.columnId+'" dfx-gc-web-base dfx-gc-web-'+$attrs.dfxGcRenderer+' dfx-gc-renderer-content="'+$attrs.componentId+'" view-id="' + viewId + '"></div>')($scope);
            $element.append(angular_snippet);
        }
    }
}]);

dfxAppRuntime.directive('dfxRepeatablePanel', [ function() {
    return {
        restrict: 'A',
        scope: true,
        controller: function($scope, $element, $attrs) {
            $scope.$dfx_index = $scope.$index;
            $scope.$dfx_first = $scope.$first;
            $scope.$dfx_odd = $scope.$odd;
            $scope.$dfx_even = $scope.$even;
            $scope.$dfx_last = $scope.$last;
            $scope.$dfxGetParentIndex = function() {
                var parent_elem = $($element).parents('div[dfx-repeatable-panel]:first');
                if (parent_elem) {
                    return parseInt($(parent_elem).attr('dfx-repeatable-panel'));
                } else {
                    return null;
                }
            };
            $scope.$dfxGetParentIndexes = function() {
                var parent_indexes = [];
                var parent_elements = $($element).parents('div[dfx-repeatable-panel]');
                for (var i=0; i<parent_elements.length; i++) {
                    parent_indexes.push( parseInt($(parent_elements[i]).attr('dfx-repeatable-panel')) );
                }
                return parent_indexes;
            };
        }
    }
}]);

dfxAppRuntime.directive('dfxDatatable', [ function() {
    return {
        restrict: 'A',
        scope: true,
        controller: function($scope, $element, $attrs) {
            $scope.$dfx_index = $scope.$index;
            $scope.$dfx_first = $scope.$first;
            $scope.$dfx_odd = $scope.$odd;
            $scope.$dfx_even = $scope.$even;
            $scope.$dfx_last = $scope.$last;
            $scope.$dfxGetParentIndex = function() {
                var parent_elem = $($element).parents('div[dfx-repeatable-panel]:first');
                if (parent_elem) {
                    return parseInt($(parent_elem).attr('dfx-repeatable-panel'));
                } else {
                    return null;
                }
            };
            $scope.$dfxGetParentIndexes = function() {
                var parent_indexes = [];
                var parent_elements = $($element).parents('div[dfx-repeatable-panel]');
                for (var i=0; i<parent_elements.length; i++) {
                    parent_indexes.push( parseInt($(parent_elements[i]).attr('dfx-repeatable-panel')) );
                }
                return parent_indexes;
            };
        }
    }
}]);

dfxAppRuntime.directive('dfxGcCompiled', [ '$rootScope', '$compile', function($rootScope, $compile) {
    return {
        restrict: 'A',
        priority:1500,
        terminal:true,
        link: function($scope, $element, $attrs) {
            if ($scope.attributes == null) {
                var unregister = $rootScope.$on($scope.component_id + '_attributes_loaded', function(event, attributes) {
                    try {
                        var gc_attributes = attributes; //(attributes.columns!=null && $attrs.dfxGcCompiled!='parent-renderer') ? attributes.columns.value[$scope.$index].renderer.attributes : attributes;
                        var regexp = /(^\')(.*)(\'$)/gm;
                        for (var attribute in $attrs) {
                            if (attribute.startsWith('dfxNg')) {
                                var attribute_value = $attrs[attribute];
                                var attribute_instance = attribute_value.split(',');
                                $element.removeAttr('dfx-'+attribute_instance[0]);
                                if (gc_attributes[attribute_instance[1]].value !='') {
                                    var expression = regexp.exec( gc_attributes[attribute_instance[1]].value );
                                    if ( expression!=null && ( gc_attributes[attribute_instance[1]].value.indexOf('+') >= 0 ) ) {
                                        expression = null;
                                    }
                                    if (expression!=null) {
                                        if (attribute_instance[0]=='ng-bind') {
                                            $element.attr( attribute_instance[0], gc_attributes[attribute_instance[1]].value );
                                        } else {
                                            $element.attr( attribute_instance[0], gc_attributes[attribute_instance[1]].value.substr( 1, gc_attributes[attribute_instance[1]].value.length-2 ) );
                                        }
                                    } else if (attribute_instance[0]=='ng-src') {
                                        $element.attr( attribute_instance[0], '{{' + gc_attributes[attribute_instance[1]].value + '}}' );
                                    } else {
                                        $element.attr( attribute_instance[0], gc_attributes[attribute_instance[1]].value );
                                    }
                                }
                            }
                        }
                        if ($('[dfx-gc-compiled-child]',$element).size() >0) {
                            $('[dfx-gc-compiled-child]',$element).each( function(i, child_element) {
                                var regexp_child = /(^\')(.*)(\'$)/gm;
                                $.each(this.attributes, function(j, attrib) {
                                    if (attrib!=null && attrib.name.startsWith('dfx-ng')) {
                                        var attribute_instance = attrib.value.split(',');
                                        $(child_element).removeAttr(attrib.name);
                                        if (gc_attributes[attribute_instance[1]].value !='') {
                                            var expression = regexp_child.exec( gc_attributes[attribute_instance[1]].value );

                                            if ( expression && ( gc_attributes[attribute_instance[1]].value.indexOf('+') >= 0 ) ) {
                                                expression = null;
                                            }
                                            if (expression!=null) {
                                                if (attribute_instance[0]=='ng-bind') {
                                                    $(child_element).attr( attribute_instance[0], gc_attributes[attribute_instance[1]].value );
                                                } else {
                                                    $(child_element).attr( attribute_instance[0], gc_attributes[attribute_instance[1]].value.substr( 1, gc_attributes[attribute_instance[1]].value.length-2 ) );
                                                }
                                            } else if (attribute_instance[0]=='ng-src') {
                                                $(child_element).attr( attribute_instance[0], '{{' + gc_attributes[attribute_instance[1]].value + '}}' );
                                            } else {
                                                $(child_element).attr( attribute_instance[0], gc_attributes[attribute_instance[1]].value );
                                            }
                                        }
                                    }
                                });
                                $(child_element).removeAttr('dfx-gc-compiled-child');
                            });
                        }
                        $element.removeAttr('dfx-gc-compiled');
                        $compile($element)($scope);
                        unregister();
                    } catch (e) {
                        console.log(e);
                    }
                });
            } else {
                var gc_attributes = ($scope.attributes.columns!=null) ? $scope.attributes.columns.value[$scope.$index].renderer.attributes : $scope.attributes;
                for (var attribute in $attrs) {
                    if (attribute.startsWith('dfxNg')) {
                        var attribute_value = $attrs[attribute];
                        var attribute_instance = attribute_value.split(',');
                        $element.removeAttr('dfx-'+attribute_instance[0]);
                        if (gc_attributes[attribute_instance[1]].value !='') {
                            $element.attr( attribute_instance[0], gc_attributes[attribute_instance[1]].value );
                        }
                    }
                }
                $element.removeAttr('dfx-gc-compiled');
                $compile($element)($scope);
            }
        }
    }
}]);


function routeToPage(page_name) {
    var element = document.getElementById('dfx_page_content');
    if (element != null) {
        var $scope = angular.element(element).scope()
        $scope.routeToPage(page_name);
    } else {
        alert( 'routeToPage() can\'t be called from preview mode' );
    }
};
var dfxAppServices = angular.module('dfxAppServices',[]);

dfxAppServices.factory('dfxAuthRequest', function() {

    var aut_request = {};

    aut_request.send = function( config, callback) {
        authRequest( config ).then( function(data) {
            callback(data);
        });
    };
    
    return aut_request;
});

dfxAppServices.factory('dfxDialog', [ '$mdDialog', '$mdToast', function($mdDialog, $mdToast) {

    var dialog = {};

    dialog.showMessage = function (message) {
        $mdToast.show(
          $mdToast.simple()
            .textContent(message)
            .theme('success-toast')
            .position('top right')
            .hideDelay(3000)
        );
    };

    dialog.showWarning = function (message) {
        $mdToast.show(
          $mdToast.simple()
            .textContent(message)
            .theme('warn-toast')
            .position('top right')
            .hideDelay(3000)
        );
    };

    dialog.showError = function (message) {
        $mdToast.show(
          $mdToast.simple()
            .textContent(message)
            .theme('error-toast')
            .position('top right')
            .hideDelay(3000)
        );
    };

    dialog.showWaitingMessage = function( data ) {
        var content = (data.type && data.type === 'progress') ? '<md-progress-linear md-mode="indeterminate"></md-progress-linear>'
            : '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>';
        if (!data.message) data.message = '';
        var template = '<md-dialog aria-label="textarea" ng-cloak flex="' + data.flexWidth +'">'
            + '<md-dialog-content style="padding:10px 10px; height: ' + data.height +';">'
            + '<h2 align="center">'  + data.message  + '</h2>'
            +  '<div align="center">' + content + '</div>'
            + '</md-dialog-content>'
            + '</md-dialog>';

        $mdDialog.show({
            parent : angular.element(document.body),
            clickOutsideToClose: false,
            escapeToClose: false,
            template: template
        });
        return $mdDialog;
    };

    dialog.showHTML = function( data ) {
        var generateButtonsContent = function() {
            var content = "";
            data.buttons.forEach(function(button) {
                content += '<md-button class="md-primary" ng-click="' + button.action + '">' + button.name + '</md-button>';
            });
            return content;
        }
            var template = '<md-dialog aria-label="textarea" ng-cloak flex="' + data.flexWidth +'">'
                    + '<form>'
                    + '<md-toolbar><div class="md-toolbar-tools">'
                    + '<h2>' + data.title +'</h2>'
                    + '</div></md-toolbar>'
                    + '<md-dialog-content style="padding:10px 10px; height: ' + data.height +';">'
                    +  data.html
                    + '</md-dialog-content>'
                    + '<div class="md-actions">'
                    + generateButtonsContent()
                    + '</div>'
                    + '</form>'
                    + '</md-dialog>';


            $mdDialog.show({
                parent : angular.element(document.body),
                clickOutsideToClose: true,
                escapeToClose: true,
                scope : data.scope,
                preserveScope : true,
                template: template
            });
        return $mdDialog;
    };

    dialog.showView = function( data ) {
        var view_object = $('#' + data.scope._view_id)[0];
        var component_id = $('div:first',view_object).attr('id');

        var generateButtonsContent = function() {
            var content = "";
            data.buttons.forEach(function(button) {
                content += '<md-button class="md-primary" ng-click="' + button.action + '">' + button.name + '</md-button>';
            });
            return content;
        }
        var template = '<md-dialog aria-label="textarea" ng-cloak flex="' + data.flexWidth +'">'
            + '<form>'
            + '<md-toolbar><div class="md-toolbar-tools">'
            + '<h2>' + data.title +'</h2>'
            + '</div></md-toolbar>'
            + '<md-dialog-content style="padding:10px 10px; height: ' + data.height +';">'
            + '<div dfx-view-preview-in-dialog="' + data.viewName +'" dfx-card = "' + data.cardName +'" id="' + data.scope._view_id +'" ng-controller="dfx_view_controller">'
            + '<div id="dfx_view_preview_container_in_dialog_' + component_id + '"></div>'
            + '</div>'
            + '</md-dialog-content>'
            + '<div class="md-actions">'
            + generateButtonsContent()
            + '</div>'
            + '</form>'
            + '</md-dialog>';


        $mdDialog.show({
            parent : angular.element(document.body),
            clickOutsideToClose: true,
            escapeToClose: true,
            scope : data.scope,
            preserveScope : true,
            template: template
        });
        return $mdDialog;
    }

    return dialog;
}]);

dfxAppServices.factory('dfxSidenav', [ '$mdSidenav', '$compile', '$timeout', function( $mdSidenav, $compile, $timeout) {

    var sideNav = {};

    sideNav.showView = function(data) {
        var view_object = $('#' + data.scope._view_id)[0];
        var component_id = $('div:first',view_object).attr('id');


        var side_nav_id = component_id + "-" + ((data.position == 'left') ? 'sidenav-left' : 'sidenav-right');
        var side_nav_width = data.width ? data.width : '300px';
        $( "md-sidenav[md-component-id='" + component_id + "-sidenav-left']" ).html("");
        $( "md-sidenav[md-component-id='" + component_id + "-sidenav-right']" ).html("");

        var template = '<md-content layout-padding style="padding:0px;">'
            + '<div dfx-view-preview-in-sidenav="' + data.viewName +'" dfx-card = "' + data.cardName +'" ng-controller="dfx_view_controller" id="' + data.scope._view_id +'" style="padding:0px;">'
            + '<div id="dfx_view_preview_container_in_sidenav_' + component_id +'" style="padding:0px;"></div>'
            + '</div>'
            + '</md-content>';

        var compiled = $compile(template)(data.scope);

        $( "md-sidenav[md-component-id='" + side_nav_id + "']").html(compiled);
        $( "md-sidenav[md-component-id='" + side_nav_id + "']").css({'min-width': side_nav_width, 'max-width': side_nav_width , 'width': side_nav_width});



        var sideNavInstance = $mdSidenav(side_nav_id);
        sideNavInstance.toggle();
        return sideNavInstance;

    }

    sideNav.showHTML = function(data) {
        var view_object = $('#' + data.scope._view_id)[0];
        var component_id = $('div:first',view_object).attr('id');

        var side_nav_id = component_id + "-" + ((data.position == 'left') ? 'sidenav-left' : 'sidenav-right');
        var side_nav_width = data.width ? data.width : '300px';
        $( "md-sidenav[md-component-id='" + component_id + "-sidenav-left']" ).html("");
        $( "md-sidenav[md-component-id='" + component_id + "-sidenav-right']" ).html("");

        var template = '<md-content layout-padding>'
            + data.html
            + '</md-content>';

        var compiled = $compile(template)(data.scope);
        var sideNavInstance = $mdSidenav(side_nav_id);
        $timeout(function(){
            $( "md-sidenav[md-component-id='" + side_nav_id + "']").html(compiled);
            $( "md-sidenav[md-component-id='" + side_nav_id + "']").css({'min-width': side_nav_width, 'max-width': side_nav_width , 'width': side_nav_width});
            sideNavInstance.toggle();
        },false);



        return sideNavInstance;


    }

    return sideNav;
}]);

dfxAppServices.directive('dfxSidenavAndBottomsheet', [ '$compile', '$timeout', function( $compile, $timeout) {
    return {
        restrict: 'A',
        controller: function($scope, $element, $attrs) {
            $timeout(function(){
                var component_id = $attrs.dfxSidenavAndBottomsheet;
                var content = '<md-sidenav md-component-id="' + component_id +'-sidenav-left"  class="md-sidenav-left" > </md-sidenav>'
                    + '<md-sidenav md-component-id="' + component_id +'-sidenav-right"  class="md-sidenav-right" > </md-sidenav>'
                    + '<div id="' + component_id +'-bottom-sheet"> </div>';
                var compiled_content = $compile(content)($scope);
                $element.append(compiled_content);
            },1000);
        }
    }
}]);

dfxAppServices.factory('dfxBottomSheet', [ '$mdBottomSheet', function($mdBottomSheet) {

    var bottomSheet = {};

    bottomSheet.showHTML = function( data ) {
        var view_object = $('#' + data.scope._view_id)[0];
        var component_id = $('div:first',view_object).attr('id');

        $("#" + component_id + "-bottom-sheet").html("");
        var template = '<md-bottom-sheet style="bottom:80px;" ng-cloak>'
            + data.html
            + '</md-bottom-sheet>';
        $mdBottomSheet.show({
            clickOutsideToClose: true,
            escapeToClose: true,
            scope : data.scope,
            preserveScope : true,
            template: template,
            parent : angular.element($("#" + component_id + "-bottom-sheet"))
        });
        return $mdBottomSheet;
    };

    bottomSheet.showView = function( data ) {
        var view_object = $('#' + data.scope._view_id)[0];
        var component_id = $('div:first',view_object).attr('id');

        $("#" + component_id + "-bottom-sheet").html("");
        var template = '<md-bottom-sheet style="padding:0px; bottom:80px;" ng-cloak>'
            + '<div dfx-view-preview-in-bottom="' + data.viewName +'" dfx-card = "' + data.cardName +'" ng-controller="dfx_view_controller" id = "' + data.scope._view_id +'" style="padding:0px;">'
            + '<div id="dfx_view_preview_container_in_bottom_' + component_id + '" style="padding:0px;"></div>'
            + '</div>'
            + '</md-bottom-sheet>';


        $mdBottomSheet.show({
            clickOutsideToClose: true,
            escapeToClose: true,
            scope : data.scope,
            preserveScope : true,
            template: template,
            parent : angular.element($("#" + component_id + "-bottom-sheet"))
        });
        return $mdBottomSheet;
    }

    return bottomSheet;
}]);

// Deprecated, replaced by dfxApiServices
dfxAppServices.factory('dfxApiRoutes', [ 'dfxUtil', function(dfxUtil) {

    var api_route = {};

    api_route.get = function( scope, route, req_data, callback, object_path, assigned_variable ) {
        requestAPIRoute({
            url:route,
            type:'get',
            data:req_data || {}
        })
            .then(function(res){
                if (object_path!=null) {
                    var arr_props = (object_path=='') ? [] : object_path.split('.');
                    var ref_prop = res.data;
                    for (var i=0; i<arr_props.length; i++) {
                        ref_prop = ref_prop[arr_props[i]];
                    }
                    try {
                        scope.$apply( function() {
                            dfxUtil.arrayAppend( assigned_variable, ref_prop );
                        });
                    } catch(err) {
                        console.log( 'API Route Call: Bad assigned variable or object path');
                    }
                }
                callback(res.data);
            })
    };

    api_route.post = function( scope, route, req_params, req_body, callback ) {
        requestAPIRoute({
            url:route,
            type:'post',
            data:{
                params : req_params || {},
                body : req_body || {}
            }
        })
            .then(function(res){
                callback(res.data);
            })
    };
    return api_route;
}]);

dfxAppServices.factory('dfxApiServices', [ 'dfxApiServiceObjects',  function( dfxApiServiceObjects ) {

    var api_services = {};

    api_services.get = function( scope, route, req_data, cache) {
        if (cache) req_data.cache = cache;
        return requestAPIRoute({
            url:route,
            type:'get',
            data: {
                data  : req_data || {},
                cache : cache ? cache : null
            }
        });
    };

    api_services.post = function( scope, route, req_params, req_body, cache) {
        return requestAPIRoute({
            url:route,
            type:'post',
            data:{
                params : req_params || {},
                body : req_body || {},
                cache : cache ? cache : null
            }
        });
    };

    api_services.clearCache = function(o) {
        var obj = {
            type : o.type,
            application : o.application,
            name : o.name
        };
        return dfxApiServiceObjects.clearCache(obj);
    }

    return api_services;
}]);

dfxAppServices.factory('dfxChangeCard', [ '$compile', '$timeout',  function( $compile, $timeout ) {
    var obj = {};
    obj.showCard = function( data ) {
        $timeout(function(){
            data.scope.dfxViewCard = data.cardName;
        },0);
    }
    return obj;
}]);

dfxAppServices.factory('dfxUtil', [ function() {

    var api_util = {};

    api_util.arrayAppend = function( array_one, array_two ) {
        if (array_one == null) {
            array_one = [];
        } else {
            array_one.splice( 0, array_one.length );
        }
        for (var i=0; i<array_two.length; i++) {
            array_one.push(array_two[i]);
        }
    };

    return api_util;
}]);
var dfxGControls = angular.module('dfxGControls',['ngMaterial', 'ngMdIcons', 'ngMessages', 'ngSanitize', 'ngAnimate', 'nvd3', 'ngQuill', 'jkAngularCarousel', 'ui.knob']);
var dfxPageEditorApp = angular.module("dfxPageEditorApp", ['ngMaterial', 'dfxStudioApi']);

dfxPageEditorApp.config(function($mdThemingProvider) {
    $mdThemingProvider.theme('altTheme')
        .primaryPalette('blue') // specify primary color, all
    // other color intentions will be inherited
    // from default
    $mdThemingProvider.setDefaultTheme('altTheme');
});

dfxPageEditorApp.controller("dfx_main_controller", [ '$scope', '$rootScope', '$q', '$http', '$mdDialog', '$mdSidenav', 'dfxViews', function($scope, $rootScope, $q, $http, $mdDialog, $mdSidenav, dfxViews) {
	$scope.application_name = $('#dfx-page-editor-body').attr('data-application');
    $scope.page_name = $('#dfx-page-editor-body').attr('data-page');
    $scope.page_platform = $('#dfx-page-editor-body').attr('data-platform');
    $scope.app_view_catalog = {};


    dfxViews.getByApp( $scope, $scope.application_name, $scope.page_platform )
    .then( function(data) {
        for (var i=0; i<data.views.length; i++) {
            if ($scope.app_view_catalog[data.views[i].category]==null) {
                $scope.app_view_catalog[data.views[i].category] = [];
            }
            $scope.app_view_catalog[data.views[i].category].push(data.views[i]);
        }
    });

	$scope.loadPage = function() {
        return '/studio/screen/editui/' + $scope.application_name + '/' + $scope.page_name + '/' + $scope.page_platform;
    };
}]);

dfxPageEditorApp.controller("dfx_page_editor_controller", [ '$scope', '$rootScope', '$compile', '$timeout', '$mdDialog', '$mdToast', '$log', '$mdSidenav', '$window', 'dfxPages','dfxTemplates', 'dfxMessaging', function($scope, $rootScope, $compile, $timeout, $mdDialog, $mdToast, $log, $mdSidenav, $window, dfxPages, dfxTemplates, dfxMessaging) {

    $scope.palette_visible = true;
    $scope.property_visible = true;
    $scope.selected_page = null;
    $scope.selected_template = null;
    $scope.templatePropertyEditMode = false;
    $scope.templates = [];
    $scope.design_visible = true;
    $scope.script_visible = false;
    $scope.design_view_mode = 'Design';
    $scope.script_theme = (localStorage.getItem('DFX_script_theme')!=null) ? localStorage.getItem('DFX_script_theme') : 'monokai';
    $scope.preview_wait_icon_visible = false;

    if ($scope.page_platform=='web') {
        $('#dfx_page_editor_workspace').css( 'width', '100%' );
    } else {
        $('#dfx_page_editor_workspace').css( 'width', '316px' );
        $('#dfx_page_editor_workspace').css( 'margin-top', '110px' );
        $('#dfx_page_editor_workspace').css( 'margin-bottom', '24px' );
        $('#dfx_page_editor_workspace').css( 'max-height', '564px' );
        $('#dfx_page_editor_container').css( 'background', 'url("/images/iphone_5_320x568.png") no-repeat' );
        $('#dfx_page_editor_container').css( 'background-position-x', '50%' );
    }

    $scope.toggleLeft = function() {
        $scope.palette_visible = !$scope.palette_visible;
        if ($scope.palette_visible) {
            $('#dfx-pe-toggle-palette-icon').addClass('fa-angle-double-left');
            $('#dfx-pe-toggle-palette-icon').removeClass('fa-angle-double-right');
            $('#dfx-pe-palette-title').removeClass('dfx-pe-palette-title-collapsed');
            $('#dfx-pe-palette-title-text').removeClass('dfx-pe-palette-title-text-collapsed');
        } else {
            $('#dfx-pe-palette-title').addClass('dfx-pe-palette-title-collapsed');
            $('#dfx-pe-palette-title-text').addClass('dfx-pe-palette-title-text-collapsed');
            $('#dfx-pe-toggle-palette-icon').removeClass('fa-angle-double-left');
            $('#dfx-pe-toggle-palette-icon').addClass('fa-angle-double-right');
        }
    };
    $scope.toggleRight = function() {
        $scope.property_visible = !$scope.property_visible;
        if ($scope.property_visible) {
            $('#dfx-pe-toggle-property-icon').removeClass('fa-angle-double-left');
            $('#dfx-pe-toggle-property-icon').addClass('fa-angle-double-right');
            $('#dfx-pe-property-title').removeClass('dfx-pe-property-title-collapsed');
            $('#dfx-pe-property-title-text').removeClass('dfx-pe-property-title-text-collapsed');
        } else {
            $('#dfx-pe-property-title').addClass('dfx-pe-property-title-collapsed');
            $('#dfx-pe-property-title-text').addClass('dfx-pe-property-title-text-collapsed');
            $('#dfx-pe-toggle-property-icon').addClass('fa-angle-double-left');
            $('#dfx-pe-toggle-property-icon').removeClass('fa-angle-double-right');
        }
    };

    $scope.exitPageEditor = function(ev) {
        var confirm = $mdDialog.confirm()
          .title('Exit')
          .textContent('Do you confirm you want to exit the editor?')
          .ariaLabel('Exit')
          .targetEvent(ev)
          .ok('OK')
          .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
          $window.close();
        }, function() {
          // do nothing
        });
    };

    $scope.loadPageDefinition = function() {
        dfxPages.getOne( $scope, $scope.application_name, $scope.page_name, $scope.page_platform )
        .then( function(page) {
            $scope.selected_page = page;
            $scope.loadPageTemplate(page.template);

            var htmlTextArea = document.getElementById('dfx_pe_script_editor');
            var src_editor = CodeMirror( function (elt) {
                htmlTextArea.parentNode.replaceChild(elt, htmlTextArea);
                },
                {
                    lineNumbers: true,
                    value: $('#dfx_pe_script_editor').text(),
                    mode: {name: 'application/json', globalVars: true},
                    matchBrackets: true,
                    highlightSelectionMatches: {showToken: /\w/},
                    styleActiveLine: true,
                    viewportMargin : Infinity,
                    extraKeys: {"Alt-F": "findPersistent", "Ctrl-Space": "autocomplete"}
                });
            $(src_editor.getWrapperElement()).attr('id', 'dfx_pe_script_editor');
            src_editor.setValue(page.script);
            src_editor.setSize(null, window.innerHeight - 59);
            src_editor.refresh();
        });
    };

    $scope.loadPageTemplates = function() {
        dfxTemplates.getAll( $scope, $scope.application_name )
        .then( function(templates) {
            $scope.templates = templates;
        });
    };

    $scope.loadPageTemplate = function(template) {
        dfxTemplates.getOne( $scope, $scope.application_name, template )
        .then( function(template) {
            $scope.selected_template = template;
            var snippet = '<div layout="column" flex dfx-page-template="' + template.name + '"></div>';
            $('#dfx_page_editor_workspace').empty();
            angular.element(document.getElementById('dfx_page_editor_workspace')).append($compile(snippet)($scope));
        });
    };

    $scope.changePageTemplate = function() {
        $scope.loadPageTemplate($scope.selected_page.template);
    }

    $scope.changeViewMode = function (view_mode) {
        if (view_mode=='design') {
            $scope.design_view_mode = 'Design';
            $scope.showDesign();
        } else if (view_mode=='script') {
            $scope.design_view_mode = 'Script';
            $scope.showScript();
        }
    };

    $scope.showDesign = function() {
        $scope.design_visible = true;
        $scope.script_visible = false;
        $('#dfx_pe_script_editor').css('display', 'none');
    };
    $scope.showScript = function() {
        $scope.design_visible = false;
        $scope.script_visible = true;
        $('#dfx_pe_script_editor').css('display', 'block');
        $timeout( function() {
            var editor = $('#dfx_pe_script_editor')[0].CodeMirror;
            editor.scrollTo(0, 0);
            editor.refresh();
            $('#dfx_pe_script_editor').click();
        }, 0);
    };

    $scope.addLayoutRow = function() {
        $scope.selected_page.layout.rows.push( {"columns": [{ "width":"100", "views":[] }] } );
    };

    $scope.deleteLayoutRow = function(row_id) {
        $scope.selected_page.layout.rows.splice( row_id, 1 );
    };

    $scope.addLayoutColumn = function(row_id) {
        $scope.selected_page.layout.rows[row_id].columns.push( { "width":"25", "views":[] } );
    };

    $scope.deleteLayoutColumn = function(row_id, col_id) {
        $scope.selected_page.layout.rows[row_id].columns.splice( row_id, 1 );
    };

    $scope.editTemplateProperty = function() {
         $scope.templatePropertyEditMode = true;
    };

    $scope.saveTemplateProperty = function() {
        dfxTemplates.update( $scope, $scope.selected_template )
            .then( function(template) {
               dfxMessaging.showMessage( 'The template ' + $scope.selected_template.name + ' has been updated' );
            });
        $scope.templatePropertyEditMode = false;
    };

    $scope.saveTemplatePropertyAs = function($event) {
        var parentEl = angular.element(document.body);

        $mdDialog.show({
            parent: parentEl,
            targetEvent: $event,
            clickOutsideToClose: true,
            scope: $scope.$new(),
            templateUrl: '/studio/studioviews/saveas_page_template.html',
            controller: DialogController
        });

        function DialogController($scope, $mdDialog) {
            $scope.template = {
                "name":   ''
            }


            $scope.saveAsTemplate = function() {
                var nameExp = /([\\/\-+(){}[\]=<>*~`?\! '\"',.;:$@#])/ig,
                    nameRes = nameExp.exec( $scope.template.name );

                if ( !nameRes && $scope.template.name !== '' ) {
                    $scope.selected_template.name = $scope.template.name;
                    $scope.selected_page.template = $scope.template.name;
                    dfxTemplates.create( $scope, $scope.selected_template )
                        .then( function(template) {
                           dfxMessaging.showMessage( 'The template ' + $scope.template.name + ' has been created' );
                           $scope.loadPageTemplates();
                        });
                    $scope.templatePropertyEditMode = false;
                    $scope.closeDialog();
                } else {
                    dfxMessaging.showWarning('Not a valid Template Name');
                }
            }

            $scope.closeDialog = function() {
                $mdDialog.hide();
            }
        }

    };

    $scope.cancelTemplateProperty = function() {
         $scope.templatePropertyEditMode = false;
    };

    $scope.editContent = function(ev, property) {
        $('#pagebody').css('z-index', '0');
        $mdDialog.show({
            scope: $scope.$new(),
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:true,
            templateUrl: '/gcontrols/web/page_html_editor_template.html',
            onComplete:function(scope){
                var myTextArea = document.getElementById('dfx_html_editor');
                var scriptEditor = CodeMirror(function (elt) {
                        myTextArea.parentNode.replaceChild(elt, myTextArea);
                    },
                    {
                        lineNumbers: true,
                        value: (scope.selected_template.layout[property].content.value),
                        mode: {name: "xml", globalVars: true},
                        matchBrackets: true,
                        highlightSelectionMatches: {showToken: /\w/},
                        styleActiveLine: true,
                        viewportMargin : Infinity,
                        extraKeys: {"Alt-F": "findPersistent", "Ctrl-Space": "autocomplete"},
                        lineWrapping: true
                    });
                scriptEditor.setSize(800, 400);
                $(scriptEditor.getWrapperElement()).attr("id", "dfx_html_editor");
            },
            controller: function(scope){
                scope.closeDialog = function() {
                    $mdDialog.hide();
                    $('#pagebody').css('z-index', '51');
                }
                scope.saveDialog = function() {
                    var editor = $('#dfx_html_editor.CodeMirror')[0].CodeMirror;
                    scope.selected_template.layout[property].content.value = editor.getValue();
                    $mdDialog.hide();
                    $('#pagebody').css('z-index', '51');
                }
            }
        })
    };

    $scope.savePageDefinition = function() {
        var editor = $('#dfx_pe_script_editor')[0].CodeMirror;
        $scope.selected_page.script = editor.getValue();
        dfxPages.update( $scope, $scope.selected_page ).then( function(data) {
            dfxMessaging.showMessage( 'The page ' + $scope.selected_page.name + ' has been saved' );
        });
    };

    $scope.openPreview = function() {
        $scope.preview_wait_icon_visible = true;
        dfxPages.preview('/studio/screen/preview/' + $scope.application_name + '/' + $scope.page_name + '/' + $scope.page_platform)
            .then(function(response){
                $scope.preview_wait_icon_visible = false;
                if (response.data.indexOf('http') > -1) {
                    $window.open(response.data, '_blank');
                } else {
                    dfxMessaging.showWarning(response.data);
                }
            },function(err){
                $scope.preview_wait_icon_visible = false;
                dfxMessaging.showWarning("Unable to call DreamFace Compiler");
            })
    };

    $scope.moveView = function(item, view_id, view_name, from_row_id, from_col_id) {
        $timeout( function() {
            var target = item.parentElement;
            if (from_row_id>-1) {
                var arr_ref = $scope.selected_page.layout.rows[from_row_id].columns[from_col_id].views;
                for (var i=0; i<arr_ref.length; i++) {
                    if (arr_ref[i].id==view_id) {
                        arr_ref.splice(i, 1);
                        break;
                    }
                }
            }
            $('div', target).each( function(idx) {
                if ($(this).attr('data-view-id')==view_id) {
                    if (from_row_id==-1) {
                        $(this).remove();
                    }
                    var row_id = parseInt($(target).attr('data-row'));
                    var col_id = parseInt($(target).attr('data-column'));
                    $scope.selected_page.layout.rows[row_id].columns[col_id].views.splice(idx, 0, {"id": view_id, "name": view_name});
                    // The following line forces to recalculate the ng-repeat
                    $scope.selected_page.layout.rows[row_id].columns[col_id].views = angular.copy($scope.selected_page.layout.rows[row_id].columns[col_id].views);
                }
            });
        }, 0);
    };

    $scope.loadViewMenu = function($event, row_id, col_id, view_id) {
        $event.stopImmediatePropagation();
        $scope.closeViewMenu();
        var snippet = '<md-whiteframe style="left:'+($event.x-5)+'px;top:'+($event.y-5)+'px;width:175px;" class="md-whiteframe-4dp dfx-view-menu" ng-mouseleave="closeViewMenu()">';
        snippet += '<div><a ng-click="removeView(' + row_id + ', ' + col_id + ', ' + view_id + ')">Remove the view</a></div>';
        snippet += '</md-whiteframe>';
        angular.element(document.getElementById('dfx_page_editor')).append($compile(snippet)($scope));
    };

    $scope.closeViewMenu = function($event) {
        $('.dfx-view-menu').remove();
    };

    $scope.removeView = function(row_id, col_id, view_id) {
        $scope.closeViewMenu();
        $timeout( function() {
            var arr_ref = $scope.selected_page.layout.rows[row_id].columns[col_id].views;
            for (var i=0; i<arr_ref.length; i++) {
                if (arr_ref[i].id==view_id) {
                    arr_ref.splice(i, 1);
                    break;
                }
            }
            // The following line forces to recalculate the ng-repeat
            $scope.selected_page.layout.rows[row_id].columns[col_id].views = angular.copy($scope.selected_page.layout.rows[row_id].columns[col_id].views);
        }, 0);
    };

    $scope.loadPageTemplates();
    $scope.loadPageDefinition();
}]);

dfxPageEditorApp.directive( 'dfxPageIncludeTemplate', function($compile) {
    return{
        restrict: 'A',
        link: function(scope, element, attributes) {
            scope.$watch('selected_template.layout.' + attributes.dfxPageIncludeTemplate + '.content.value', function(new_value) {
                element.html(new_value);
                $compile(element.contents())(scope);
            });
        }
    }
});

dfxPageEditorApp.directive('dfxPageTemplate', ['$compile', '$mdSidenav', function($compile, $mdSidenav) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            var tpl_snippet = '';

            // Header
            tpl_snippet = '<div layout="row" ng-show="selected_template.layout.header.display==\'true\'"><div layout-align="{{selected_template.layout.header.halignment}} {{selected_template.layout.header.valignment}}" flex="100" style="height:{{selected_template.layout.header.height}};{{selected_template.layout.header.style}}" dfx-page-include-template="header"></div></div>';

            // Middle Section Start
            tpl_snippet += '<div layout="row" style="position:relative;{{selected_template.layout.body.style}}" flex>';

            // Left
            tpl_snippet += '<div id="dfxpageleft" ng-show="selected_template.layout.left.display==\'true\'" style="width:{{selected_template.layout.left.width}};{{selected_template.layout.left.style}};z-index:50;" class="{{selected_template.layout.left.whiteframe}}"><md-content layout="column" layout-align="{{selected_template.layout.left.halignment}} {{selected_template.layout.left.valignment}}" style="background:inherit" dfx-page-include-template="left"></md-content></div>';

            // Body
            tpl_snippet += '<div layout="column" style="background:inherit;z-index: 51;border:1px #37474F solid;overflow:auto;" layout-padding class="content-wrapper" flex id="pagebody">';

            tpl_snippet += '<div layout="row" style="" flex="{{row.autoHeight != true ? row.height : \'\'}}" ng-repeat="row in selected_page.layout.rows">';
            tpl_snippet += '<div layout="column" flex="{{col.width}}" class="dfx-page-droppable-column" dfx-page-droppable-column data-row="{{$parent.$index}}" data-column="{{$index}}" ng-repeat="col in row.columns" style="border:1px #999 solid;">';
            tpl_snippet += '<div ng-repeat="view in col.views" dfx-page-sortable-view class="{{(view.fit==\'content\') ? \'\' : \'flex\'}} md-whiteframe-3dp" style="letter-spacing:0.2em;background:#4cd5f3;color:#383838;cursor:pointer;" layout="row" layout-align="center center" data-view-id="{{view.id}}" data-view="{{view.name}}"><div class= "dfx-pe-view-menu"><span>{{view.name}}</span><a ng-click="loadViewMenu($event, $parent.$parent.$index, $parent.$index, view.id)" class="dfx-pe-view-menu-item"><i class="fa fa-gear"></i></a></div></div>';
            tpl_snippet += '</div>';
            tpl_snippet += '</div>';

            tpl_snippet += '</div>';

            // Right
            tpl_snippet += '<div id="dfxpageright" ng-show="selected_template.layout.right.display==\'true\'" style="width:{{selected_template.layout.right.width}};{{selected_template.layout.right.style}};z-index:50;" class="{{selected_template.layout.right.whiteframe}}"><md-content layout layout-align="{{selected_template.layout.right.halignment}} {{selected_template.layout.right.valignment}}" style="background:inherit" dfx-page-include-template="right"></md-content></div>';

            // Middle Section End
            tpl_snippet += '</div>';

            // Footer
            tpl_snippet += '<div layout="row" ng-show="selected_template.layout.footer.display==\'true\'"><div layout layout-align="{{selected_template.layout.footer.halignment}} {{selected_template.layout.footer.valignment}}" flex="100" style="height:{{selected_template.layout.footer.height}};{{selected_template.layout.footer.style}}"  dfx-page-include-template="footer"></div></div>';

            $element.append($compile(tpl_snippet)($scope));
        }
    }
}]);

dfxPageEditorApp.directive('dfxPageDraggableView', [function() {
    return {
        restrict: 'A',
        controller: function($scope, $element, $attrs) {
            $($element).draggable({
                appendTo:          "body",
                cursorAt:          {top: 5, left: 20},
                cursor:            "move",
                helper: function(event) {
                    var helper_snippet = '<div class="md-whiteframe-z2" style="width:120px;height:50px;letter-spacing: 0.2em;color:#383838;background:#4cd5f3;line-height:50px;text-align:center;vertical-align:middle;white-space: nowrap;text-overflow: ellipsis; overflow: hidden; padding: 0 5px;">' + $element.text() + '</div>';
                    return helper_snippet;
                },
                zIndex: 2000,
                connectToSortable: ".dfx-page-droppable-column"
            });

        }
    }
}]);

dfxPageEditorApp.directive('dfxPageSortableView', [function() {
    return {
        restrict: 'A',
        controller: function($scope, $element, $attrs) {

        }
    }
}]);

dfxPageEditorApp.directive('dfxPageDroppableColumn', [function() {
    return {
        restrict: 'A',
        controller: function($scope, $element, $attrs) {
           $($element).sortable({
                appendTo: "body",
                connectWith: ".dfx-page-droppable-column",
                cursor: "move",
                helper: function(event) {
                    var width = $(event.toElement).css( 'width' );
                    var height = $(event.toElement).css( 'height' );
                    var snippet = '<div class="md-whiteframe-z2 layout-align-center-center layout-row" style="letter-spacing: 0.2em;color:#fff;background:#455A64;width:' + width + ';height:' + height + '"><span>' + $(event.toElement).text() + '</span></div>';
                    return snippet;
                },
                start: function (event, ui) {
                    $(ui.placeholder).html('<div style="border:3px #00c3f3 dashed;min-width:50px;height:30px;"></div>');
                },
                stop: function (event, ui) {
                    var draggable_view = ui.item[0];
                    if ($(draggable_view).attr('dfx-page-draggable-view')==null) {
                        var view_id = $(draggable_view).attr('data-view-id');
                        var view_name = $(draggable_view).attr('data-view');
                        var row_id = parseInt($(event.target).attr('data-row'));
                        var col_id = parseInt($(event.target).attr('data-column'));
                        $scope.moveView( draggable_view, view_id, view_name, row_id, col_id );
                    } else {
                        var view_id = Math.floor(Math.random() * 100000);
                        $(draggable_view).css('display', 'none');
                        $(draggable_view).attr('data-view-id', view_id);
                        var view_name = $(draggable_view).text();
                        var row_id = -1;
                        var col_id = -1;
                        $scope.moveView( draggable_view, view_id, view_name, row_id, col_id );
                    }
                }
            });
        }
    }
}]);

dfxPageEditorApp.directive('dfxPageProperties', [ function() {
    return {
        restrict: 'A',
        templateUrl: function( el, attrs ) {
            return '/studio/studioviews/page_properties_edit.html';
        },
        link: function(scope, element, attrs) {
        }
    }
}]);


dfxPageEditorApp.controller("dfx_view_controller", [ '$scope', function($scope) {

}]);

dfxPageEditorApp.directive('dfxView', [ '$http', '$timeout', function($http, $timeout) {
    return {
        restrict: 'A',
        controller: function($scope, $element, $attrs) {
            $element.html( '<div style="width:100%;height:100%;background:#8EC3F1;color:#000;text-align:center"><span style="vertical-align:middle">' + $attrs.dfxView + '</span></div>' );
        }
    }
}]);

var dfxStudioApi = angular.module("dfxStudioApi",[]);

dfxStudioApi.factory('dfxMessaging', ['$mdToast', function($mdToast) {

    var messaging_service = {};

    messaging_service.showMessage = function (message) {
        $mdToast.show(
          $mdToast.simple()
            .textContent(message)
            .theme('success-toast')
            .position('top right')
            .hideDelay(3000)
        );
    };

    messaging_service.showWarning = function (message) {
        $mdToast.show(
          $mdToast.simple()
            .textContent(message)
            .theme('warn-toast')
            .position('top right')
            .hideDelay(3000)
        );
    };

    messaging_service.showError = function (message) {
        $mdToast.show(
          $mdToast.simple()
            .textContent(message)
            .theme('error-toast')
            .position('top right')
            .hideDelay(3000)
        );
    };

    return messaging_service;

}]);

dfxStudioApi.factory('dfxAuthRequest', function() {

    var aut_request = {};

    aut_request.send = function( config, callback) {
        authRequest( config ).then( function(data) {
            callback(data);
        });
    };
    
    return aut_request;
});

dfxStudioApi.factory('dfxStats', [ '$http', '$q', function($http, $q) {

    var api_stats = {};

    api_stats.getMain = function( scope ) {
        var deferred = $q.defer();
        
        $http({
            method: 'GET',
            url: '/studio/stats/main'
        }).then(function successCallback(response) {
            deferred.resolve( response.data );
        });
        
        return deferred.promise;
    }
    return api_stats;
}]);

dfxStudioApi.factory('dfxPlatformBluemix', ['$http', '$q', function($http, $q) {
    var api_bluemix = {};

    api_bluemix.getAppsBuilds = function(){
        var deferred = $q.defer();
        $http({
            url: '/studio/builds',
            method: "GET"
        }).then(function successCallback(response) {
            deferred.resolve( response);
        }, function errorCallback(response){
            deferred.reject( response);
        });
        return deferred.promise;
    }

    api_bluemix.bluemixLogin = function(data){
        var deferred = $q.defer();
        $http({
            url: '/studio/bm/loginBlueMix',
            method: "POST",
            data: {
                email:      data.email,
                password:   data.pass
            }
        }).then(function successCallback(response) {
            deferred.resolve( response);
        }, function errorCallback(response){
            deferred.reject( response);
        });
        return deferred.promise;
    }

    api_bluemix.bluemixLogout = function(){
        var deferred = $q.defer();
        $http({
            url: '/studio/bm/logout',
            method: "POST"
        }).then(function successCallback(response) {
            deferred.resolve( response);
        }, function errorCallback(response){
            deferred.reject( response);
        });
        return deferred.promise;
    }

    api_bluemix.getOrgsList = function(){
        var deferred = $q.defer();
        $http({
            url: '/studio/bm/getOrgsList',
            method: "GET"
        }).then(function successCallback(response) {
            deferred.resolve( response);
        }, function errorCallback(response){
            deferred.reject( response);
        });
        return deferred.promise;
    }

    api_bluemix.saveImage = function (imgname, version, apps){
        var deferred = $q.defer();
        $http({
            url: '/studio/bm/build',
            method: "POST",
            data: {
                "cnt": {
                    applications: apps
                },
                imageName:      imgname,
                imageVersion:   version
            }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        }, function errorCallback(response){
            deferred.reject( response);
        });
        return deferred.promise;
    }

    /*studio/bm/loginStatus*/

    api_bluemix.getUser = function (){
        var deferred = $q.defer();
        $http({
            url: '/studio/bm/loginStatus',
            method: "POST"
        }).then(function successCallback(response) {
            deferred.resolve( response );
        }, function errorCallback(response){
            deferred.reject( response);
        });
        return deferred.promise;
    }

    api_bluemix.deleteImage = function (imgname, version){
        var deferred = $q.defer();
        $http({
            url: '/studio/bm/removeImage',
            method: "POST",
            data: {
                imageName:      imgname,
                version:   version
            }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        }, function errorCallback(response){
            deferred.reject( response);
        });
        return deferred.promise;
    }

    api_bluemix.setChoosenOrg = function(guid){
        var deferred = $q.defer();
        $http({
            url: '/studio/bm/setChoosenOrg',
            method: "POST",
            data: {
                guid: guid
            }
        }).then(function successCallback(response) {
            deferred.resolve( response);
        });
        return deferred.promise;
    }

    api_bluemix.getSpacesList = function(){
        var deferred = $q.defer();
        $http({
            url: '/studio/bm/getSpacesList',
            method: "GET"
        }).then(function successCallback(response) {
            deferred.resolve( response);
        });
        return deferred.promise;
    }

    api_bluemix.setChoosenSpace = function(guid){
        var deferred = $q.defer();
        $http({
            url: '/studio/bm/setChoosenSpace',
            method: "POST",
            data: {
                guid: guid
            }
        }).then(function successCallback(response) {
            deferred.resolve( response);
        });
        return deferred.promise;
    }

    api_bluemix.getChoosenSpace = function(){
        var deferred = $q.defer();
        $http({
            url: '/studio/bm/getChoosenSpace',
            method: "GET"
        }).then(function successCallback(response) {
            deferred.resolve( response);
        });
        return deferred.promise;
    }

    api_bluemix.loginCF = function(){
        var deferred = $q.defer();
        $http({
            url: '/studio/bm/loginCF',
            method: "POST"
        }).then(function successCallback(response) {
            deferred.resolve( response);
        });
        return deferred.promise;
    }

    api_bluemix.remoteImagesList = function(){
        var deferred = $q.defer();
        $http({
            url: '/studio/bm/remoteImagesList',
            method: "GET"
        }).then(function successCallback(response) {
            deferred.resolve( response.data.data);
        });
        return deferred.promise;
    }

    api_bluemix.getNamespace = function(){
        var deferred = $q.defer();
        $http({
            url: '/studio/bm/getNamespace',
            method: "GET"
        }).then(function successCallback(response) {
            deferred.resolve( response);
        });
        return deferred.promise;
    }

    return api_bluemix;
}]);

dfxStudioApi.factory('dfxPlatformDevelopers', [ '$http', '$q', function($http, $q) {
    var api_developers = {};

    api_developers.getUsers = function (data){
        var deferred = $q.defer();
        $http({
            url: '/studio/users/list',
            method: "POST",
            data: data
        }).then(function successCallback(response) {
            deferred.resolve( response.data.data);
        });
        return deferred.promise;
    }

    api_developers.updateUser = function (user, newpass, passchanged){
        var deferred = $q.defer();
        if(passchanged){
            $http({
                url: '/studio/users/update/',
                method: "POST",
                data: {
                    "login": user.login,
                    "firstName": user.firstName,
                    "lastName": user.lastName,
                    "email": user.email,
                    "pass": newpass,
                    "roles": {
                        "list": user.roles.list,
                        "default": user.roles.default
                    }
                }
            }).then(function successCallback(response) {
                deferred.resolve( response );
            });
        }else{
            $http({
                url: '/studio/users/update/',
                method: "POST",
                data: {
                    "login": user.login,
                    "firstName": user.firstName,
                    "lastName": user.lastName,
                    "email": user.email,
                    "roles": {
                        "list": user.roles.list,
                        "default": user.roles.default
                    }
                }
            }).then(function successCallback(response) {
                deferred.resolve( response );
            });
        }
        return deferred.promise;
    }

    api_developers.createUser = function (user){
        var deferred = $q.defer();
        $http({
            url: '/studio/users/create/',
            method: "POST",
            data: {
                "login": user.login,
                "firstName": user.firstName,
                "lastName": user.lastName,
                "email": user.email,
                "pass": user.pass,
                "kind": "system",
                "roles": {
                    "list": user.roles.list,
                    "default": user.roles.default
                }
            }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        }, function errorCallback(response){
            deferred.reject( response );
        });
        return deferred.promise;
    }

    api_developers.deleteUser = function (login){
        var deferred = $q.defer();
        $http({
            url: '/studio/users/remove',
            method: "POST",
            data: {
                "login": login
            }
        }).then(function successCallback(response) {
            deferred.resolve( response.data.data);
        });

        return deferred.promise;
    }

    return api_developers;
}]);

dfxStudioApi.factory('dfxGoogleMapProperties', [ '$http', '$q', function($http, $q) {
    var api = {};

    api.getAPIKey = function (tenantId){
        var deferred = $q.defer();
        $http({
            url: '/api/tenant/get?tenantid=' + tenantId,
            method: "GET"
        }).then(function successCallback(response) {
            deferred.resolve( response.data.data);
        });
        return deferred.promise;
    }

    api.putAPIKey = function (tenantId, APIKey){
        var deferred = $q.defer();
        var data = {"query" : {"googleAPIKey":APIKey}};
        $http({
            url: '/api/tenant/edit?tenantid=' + tenantId,
            method: "POST",
            data: data
        }).then(function successCallback(response) {
            deferred.resolve( response.data.data);
        });
        return deferred.promise;
    }


    return api;
}]);

dfxStudioApi.factory('dfxPhoneGapProperties', [ '$http', '$q', function($http, $q) {
    var api = {};

    api.getData = function (tenantId){
        var deferred = $q.defer();
        $http({
            url: '/api/tenant/get?tenantid=' + tenantId,
            method: "GET"
        }).then(function successCallback(response) {
            deferred.resolve( response.data.data);
        });
        return deferred.promise;
    }

    api.saveData = function (tenantId, data){
        var deferred = $q.defer();
        var query = {"query" : data};
        $http({
            url: '/api/tenant/edit?tenantid=' + tenantId,
            method: "POST",
            data: query
        }).then(function successCallback(response) {
            deferred.resolve( response.data.data);
        });
        return deferred.promise;
    }


    return api;
}]);

dfxStudioApi.factory('dfxEmail', [ '$http', '$q', function($http, $q) {
    var email = {};

    email.sendMail = function(data){
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: '/studio/support-email/send',
            data: {
                contactName: data.contact_name,
                contactEmail: data.contact_email,
                contactMsg: data.contact_msg,
                subject: data.subject
            }

        }).then(function successCallback(response){
            deferred.resolve(response);
        }, function errorCallback(response){
            deferred.reject( response );
        })
        return deferred.promise;
    }
    return email;
}]);

dfxStudioApi.factory('dfxApplications', [ '$http', '$q', function($http, $q) {
    var api_applications = {};

    api_applications.getUserInfo = function() {
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: '/studio/application/getUserInfo/test'
        }).then(function successCallback(response) {
            deferred.resolve( response.data.data[0]);
        }, function errorCallback(response){
            deferred.reject( response);
        })
        return deferred.promise;
    }

    api_applications.createNewApp = function(appname, title, logo) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: '/studio/application/create',
            data: {
                "applicationName": appname,
                "platform": "web",
                "ownerId": "",
                "title": title,
                "logo": logo
            }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        }, function errorCallback(response){
            deferred.reject( response.message );
        })
        return deferred.promise;
    }

    api_applications.deleteApp = function(appname) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: '/studio/application/delete',
            data: {
                "applicationName": appname
            }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        return deferred.promise;
    }

    api_applications.getAll = function( scope ) {
        var deferred = $q.defer();
        
        $http({
            method: 'GET',
            url: '/studio/tree'
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_applications.getAppTree = function( scope, app_name ) {
        var deferred = $q.defer();
        
        $http({
            method: 'GET',
            url: '/studio/tree?application=' + app_name
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_applications.getGeneral = function(appname) {
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: '/studio/application/get/'+ appname
        }).then(function successCallback(response) {
            deferred.resolve( response.data.data );
        });
        return deferred.promise;
    }

    api_applications.saveGeneral = function (title, appname, logo){
        var deferred = $q.defer();
        $http({
            url: '/studio/application/update/'+ appname,
            method: "POST",
            data: {
                    "title": title,
                    "logo": logo
            }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });

        return deferred.promise;
    }

    api_applications.saveLoginPage = function (obj){
        var deferred = $q.defer();
        $http({
            url: '/studio/application/update/'+ obj.application,
            method: "POST",
            data: obj.data
        }).then(function successCallback(response) {
            deferred.resolve( response );
        }, function errorCallback(response){
            deferred.reject( response.message );
        });

        return deferred.promise;
    }

    api_applications.saveCollaboration = function (channel, appname){
        var deferred = $q.defer();
        $http({
            url: '/studio/application/update/'+ appname,
            method: "POST",
            data: {
                "channel": channel
            }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });

        return deferred.promise;
    }

    api_applications.getGithubData = function (appname){
        var deferred = $q.defer();
        $http({
            url: '/studio/github/fetch-settings/' + appname,
            method: "GET"
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });

        return deferred.promise;
    }

    api_applications.saveGithub = function (data){
        var deferred = $q.defer();
        $http({
            url: '/studio/github/saveSettings/',
            method: "POST",
            data: data
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });

        return deferred.promise;
    }

    api_applications.getImages = function(appname){
        var deferred = $q.defer();
        $http({
            url: '/studio/resources',
            method: "POST",
            data: {
                "action" : "list",
                "applicationName" : appname
            }
        }).then(function successCallback(response) {
            var arr = response.data.data;
            var result = [];
            for(var i =0; i < arr.length; i++){
                if(arr[i].name === "assets"){
                    var images = arr[i].items;
                    for(var j=0; j < images.length; j++){
                        result.push('/studio/resources/preview/' + appname + '/assets/' + images[j].path);
                    };
                }
            }
            deferred.resolve(result);
        });
        return deferred.promise;
    }

    api_applications.getSharedImages = function(){
        var deferred = $q.defer();
        $http({
            url: '/studio/resources',
            method: "POST",
            data: {
                "action" : "list"
            }
        }).then(function successCallback(response) {
            var arr = response.data.data;
            var result = [];
            for(var i =0; i < arr.length; i++){
                if(arr[i].name === "assets"){
                    var images = arr[i].items;
                    for(var j=0; j < images.length; j++){
                        result.push('/studio/resources/preview/' + '_shared/assets/' + images[j].path);
                    };
                }
            }
            deferred.resolve(result);
        });
        return deferred.promise;
    }

    api_applications.saveResources = function(data){
        var deferred = $q.defer();
        $http({
            url: '/studio/resources',
            method: "POST",
            data: data
        }).then(function successCallback(response) {
            deferred.resolve(response);
        });
        return deferred.promise;
    }

    api_applications.saveDictionary = function(appname, data){
        var deferred = $q.defer();
        $http({
            url: '/studio/data_dictionary/put/' + appname,
            method: "POST",
            data: data
        }).then(function successCallback(response) {
            deferred.resolve(response);
        });
        return deferred.promise;
    }

    api_applications.removeDataDictionary = function(name, appname){
        var deferred = $q.defer();
        $http({
            url: '/studio/data_dictionary/remove/' + name + '/' + appname,
            method: "DELETE"
        }).then(function successCallback(response) {
            deferred.resolve(response);
        });
        return deferred.promise;
    }

    api_applications.getDataDictionaries = function(appname){
        var deferred = $q.defer();
        $http({
            url: '/studio/data_dictionary/list/' + appname,
            method: "GET"
        }).then(function successCallback(response) {
            deferred.resolve(response);
        });
        return deferred.promise;
    }

    api_applications.getResources = function(appname){
        var deferred = $q.defer();
        $http({
            url: '/studio/resources',
            method: "POST",
            data: {
                "action" : "list",
                "applicationName" : appname
            }
        }).then(function successCallback(response) {
            deferred.resolve(response);
        });
        return deferred.promise;
    }

    api_applications.createResource = function(data){
        var deferred = $q.defer();
        $http({
            url: '/studio/resources',
            method: "POST",
            data: data
        }).then(function successCallback(response) {
            deferred.resolve(response);
        });
        return deferred.promise;
    }

    api_applications.getResourceContent = function(data){
        var deferred = $q.defer();
        $http({
            url: '/studio/resources',
            method: "POST",
            data: data
        }).then(function successCallback(response) {
            deferred.resolve(response.data.data);
        });
        return deferred.promise;
    }

    api_applications.updateResource = function(data){
        var deferred = $q.defer();
        $http({
            url: '/studio/resources',
            method: "POST",
            data: data
        }).then(function successCallback(response) {
            deferred.resolve(response);
        });
        return deferred.promise;
    }

    api_applications.findAll = function( search ) {
        var deferred = $q.defer();
        
        $http({
            method: 'GET',
            url: '/studio/components/search?q=' + search
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    };

    api_applications.copyObject = function( scope, to_copy ) {
        var deferred = $q.defer();
        
        var data = {
            saveAsName:        to_copy.name,
            applicationName:   to_copy.application,
            applicationTarget: to_copy.applicationTarget,            
            categoryTarget:    to_copy.categoryTarget,
            type:              to_copy.type
        }

        switch ( to_copy.type ) {
            case 'screen': data.screenName = to_copy.queryName; data.platform = to_copy.platform; data.ownerId = ''; break;
            case 'widget': data.widgetName = to_copy.queryName; data.platform = to_copy.platform; break;
            case 'dataquery':
                data.queryName = to_copy.queryName;
                data.prefix    = to_copy.prefix;
                break;
        }

        $http({
            method: 'POST',
            url: '/studio/application/copyObject',
            data: data
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });

        return deferred.promise;
    }

    api_applications.copyCategory = function( scope, category ) {
        var deferred = $q.defer();
        
        $http({
            method: 'POST',
            url: '/studio/application/copyCategory',
            data: category
        }).then(function successCallback(response) {
            deferred.resolve( response );
        }, function errorCallback(response){
            deferred.reject( response );
        });

        return deferred.promise;
    }

    return api_applications;
}]);

dfxStudioApi.factory('dfxDeployment', [ '$http', '$q', function($http, $q) {
    var api_build = {};

    api_build.getAppBuilds = function(appname, platform) {
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: '/studio/compiler/build/list/' + appname + '/' + platform
        }).then(function successCallback(response) {
            deferred.resolve( response.data );
        });
        return deferred.promise;
    }

    api_build.runCompilerTask = function(url) {
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: url
        }).then(function successCallback(response) {
            deferred.resolve( response );
        },function errorCallback(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    api_build.registerNewBuild = function(data, appname, platform){
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: '/studio/compiler/build/register/' + appname + '/' + platform,
            data: {
                applicationName:    appname,
                platform:           platform,
                applicationVersion: data.app_version,
                buildNumber:        data.build_number,
                buildDescription:   data.description,
                buildReleaseNotes:  data.release_notes,
                buildDate:          data.build_date,
                error:              data.error
            }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        return deferred.promise;
    }

    api_build.deleteBuild = function(data){
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: '/studio/compiler/build/remove/' + data.applicationName + '/' + data.platform,
            data: {
                applicationName:    data.applicationName,
                applicationVersion: data.applicationVersion,
                buildNumber:        data.buildNumber
            }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        return deferred.promise;
    }

    api_build.getLogFile = function(data){
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: '/studio/compiler/getlogfile' ,
            data: data
        }).then(function successCallback(response) {
            deferred.resolve( response.data );
        });
        return deferred.promise;
    }

    api_build.getDeployedBuilds = function(data){
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: '/studio/deployment/list'
        }).then(function successCallback(response) {
            deferred.resolve( response.data.data );
        },function failCallback(response) {
            deferred.reject( response );
        });
        return deferred.promise;
    }

    api_build.deleteDeployedBuild = function(appname, build){
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: '/studio/deployment/delete/' + appname + '/' + build
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        return deferred.promise;
    }

    api_build.deployBuild = function(data){
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: '/studio/deployment/deploy' ,
            data: data
        }).then(function successCallback(response) {
            if ((response.data.status) && (response.data.status == "failed")){
                deferred.reject("Error");
            } else {
                deferred.resolve(response);
            }
        });
        return deferred.promise;
    }

    api_build.getMobileApp = function(build) {
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: '/studio/phonegap/getByPlatform',
            params: { platform: 'android', appId: build.phoneGapAppId }
        }).then(function successCallback(response) {
            deferred.resolve( response.data );
        });
        return deferred.promise;
    }

    return api_build;
}]);

dfxStudioApi.factory('dfxAuthProviders', [ '$http', '$q', function($http, $q) {
    var api_providers = {};

    api_providers.createProvider = function(protocol, provider, appname) {
        var deferred = $q.defer();
        if(protocol === "none"){
            $http({
                method: 'POST',
                url: '/studio/auth-providers/',
                data:  {
                    "action":           "put",
                    "dataSource":        provider.selected_data_source,
                    "provider":          provider.provider,
                    "schema":            provider.schema,
                    "applicationName":   appname,
                    "route":             provider.rest.route,
                    "credentials": {}
                }
            }).then(function successCallback(response) {
                deferred.resolve( response);
            });
        }else if(protocol === "basic" || protocol === "digest"){
            $http({
                method: 'POST',
                url: '/studio/auth-providers/',
                data:  {
                    "action":           "put",
                    "dataSource":        provider.selected_data_source,
                    "provider":          provider.provider,
                    "schema":            provider.schema,
                    "applicationName":   appname,
                    "credentials": {
                        "username":      provider.ap_basic_digest.credentials.username,
                        "password":      provider.ap_basic_digest.credentials.password
                    }
                }
            }).then(function successCallback(response) {
                deferred.resolve( response);
            });
        }else if(protocol === "oAuth1"){
            $http({
                method: 'POST',
                url: '/studio/auth-providers/',
                data:  {
                    "action" :           "put",
                    "dataSource":        provider.selected_data_source,
                    "provider":          provider.provider,
                    "schema":            "oAuth1",
                    "applicationName":   appname,
                    "credentials" : {
                        "signature_method": provider.ap_oAuth_1.credentials.selected_method,
                        "consumer_key" :    provider.ap_oAuth_1.credentials.consumer_key,
                        "access_token" :    provider.ap_oAuth_1.credentials.access_token,
                        "consumer_secret" : provider.ap_oAuth_1.credentials.consumer_secret,
                        "access_secret" :   provider.ap_oAuth_1.credentials.access_secret
                    }
                }
            }).then(function successCallback(response) {
                deferred.resolve( response);
            });
        }else if(protocol === "oAuth2"){
            if(provider.ap_oAuth_2.selected_type === "facebook"){
                $http({
                    method: 'POST',
                    url: '/studio/auth-providers/',
                    data:  {
                        "action" :           "put",
                        "dataSource":        provider.selected_data_source,
                        "provider":          provider.provider,
                        "schema":            "oAuth2",
                        "applicationName":   appname,
                        "credentials" : {
                            "type":               "facebook",
                            "access_token":       provider.ap_oAuth_2.credentials.access_token,
                            "consumer_key" :      provider.ap_oAuth_2.credentials.consumer_key,
                            "consumer_secret" :   provider.ap_oAuth_2.credentials.consumer_secret,
                            "authorize_path" :    provider.ap_oAuth_2.credentials.authorize_path,
                            "access_token_path" : provider.ap_oAuth_2.credentials.access_token_path,
                            "response_type" :     provider.ap_oAuth_2.credentials.response_type,
                            "scope" :             provider.ap_oAuth_2.credentials.scope
                        }
                    }
                }).then(function successCallback(response) {
                    deferred.resolve( response);
                });
            }else if(provider.ap_oAuth_2.selected_type === "google"){
                $http({
                    method: 'POST',
                    url: '/studio/auth-providers/',
                    data:  {
                        "action" :           "put",
                        "dataSource":        provider.selected_data_source,
                        "provider":          provider.provider,
                        "schema":            "oAuth2",
                        "applicationName":   appname,
                        "credentials" : {
                            "type":               "google",
                            "access_token":       provider.ap_oAuth_2.credentials.access_token,
                            "consumer_key" :      provider.ap_oAuth_2.credentials.consumer_key,
                            "consumer_secret" :   provider.ap_oAuth_2.credentials.consumer_secret,
                            "base_site" :         provider.ap_oAuth_2.credentials.base_provider_url,
                            "authorize_path" :    provider.ap_oAuth_2.credentials.authorize_path,
                            "access_token_path" : provider.ap_oAuth_2.credentials.access_token_path,
                            "response_type" :     provider.ap_oAuth_2.credentials.response_type,
                            "scope" :             provider.ap_oAuth_2.credentials.scope
                        }
                    }
                }).then(function successCallback(response) {
                    deferred.resolve( response);
                });
            }
        }
        return deferred.promise;
    };

    api_providers.saveProvider = function(protocol, provider, appname) {
        var deferred = $q.defer();
        if(protocol === "none"){
            $http({
                method: 'POST',
                url: '/studio/auth-providers/',
                data:  {
                    "action":           "put",
                    "dataSource":        provider.dataSource,
                    "provider":          provider.provider,
                    "schema":            provider.schema,
                    "route":             provider.route,
                    "applicationName":   appname,
                    "credentials": {}
                }
            }).then(function successCallback(response) {
                deferred.resolve( response);
            });
        }else if(protocol === "basic" || protocol === "digest"){
            $http({
                method: 'POST',
                url: '/studio/auth-providers/',
                data:  {
                    "action":           "put",
                    "dataSource":        provider.dataSource,
                    "provider":          provider.provider,
                    "schema":            provider.schema,
                    "applicationName":   appname,
                    "credentials": {
                        "username":      provider.credentials.username,
                        "password":      provider.credentials.password
                    }
                }
            }).then(function successCallback(response) {
                deferred.resolve( response);
            });
        }else if(protocol === "oAuth1"){
            $http({
                method: 'POST',
                url: '/studio/auth-providers/',
                data:  {
                    "action" :           "put",
                    "dataSource":        provider.dataSource,
                    "provider":          provider.provider,
                    "schema":            "oAuth1",
                    "applicationName":   appname,
                    "credentials" : {
                        "signature_method": provider.credentials.signature_method,
                        "consumer_key" :    provider.credentials.consumer_key,
                        "access_token" :    provider.credentials.access_token,
                        "consumer_secret" : provider.credentials.consumer_secret,
                        "access_secret" :   provider.credentials.access_secret
                    }
                }
            }).then(function successCallback(response) {
                deferred.resolve( response);
            });
        }else if(protocol === "oAuth2"){
            if(provider.credentials.type === "facebook"){
                $http({
                    method: 'POST',
                    url: '/studio/auth-providers/',
                    data:  {
                        "action" :           "put",
                        "dataSource":        provider.dataSource,
                        "provider":          provider.provider,
                        "schema":            "oAuth2",
                        "applicationName":   appname,
                        "credentials" : {
                            "type":               "facebook",
                            "access_token":       provider.credentials.access_token,
                            "consumer_key" :      provider.credentials.consumer_key,
                            "consumer_secret" :   provider.credentials.consumer_secret,
                            "authorize_path" :    provider.credentials.authorize_path,
                            "access_token_path" : provider.credentials.access_token_path,
                            "response_type" :     provider.credentials.response_type,
                            "scope" :             provider.credentials.scope
                        }
                    }
                }).then(function successCallback(response) {
                    deferred.resolve( response);
                });
            }else if(provider.credentials.type === "google"){
                $http({
                    method: 'POST',
                    url: '/studio/auth-providers/',
                    data:  {
                        "action" :           "put",
                        "dataSource":        provider.dataSource,
                        "provider":          provider.provider,
                        "schema":            "oAuth2",
                        "applicationName":   appname,
                        "credentials" : {
                            "type":               "google",
                            "access_token":       provider.credentials.access_token,
                            "consumer_key" :      provider.credentials.consumer_key,
                            "consumer_secret" :   provider.credentials.consumer_secret,
                            "base_site" :         provider.credentials.base_site,
                            "authorize_path" :    provider.credentials.authorize_path,
                            "access_token_path" : provider.credentials.access_token_path,
                            "response_type" :     provider.credentials.response_type,
                            "scope" :             provider.credentials.scope
                        }
                    }
                }).then(function successCallback(response) {
                    deferred.resolve( response);
                });
            }
        }
        return deferred.promise;
    };

    api_providers.getProviders = function(appname) {
        var deferred = $q.defer();

        $http({
            method: 'POST',
            url: '/studio/auth-providers',
            data:{
                action:             'items',
                applicationName:    appname
            }
        }).then(function successCallback(response) {
            deferred.resolve( response.data.data );
        });

        return deferred.promise;
    };

    api_providers.getProvider = function(providername, appname) {
        var deferred = $q.defer();

        $http({
            method: 'POST',
            url: '/studio/auth-providers',
            data:{
                action:             "get",
                provider:           providername,
                applicationName:    appname
            }
        }).then(function successCallback(response) {
            deferred.resolve( response.data.data );
        });

        return deferred.promise;
    };

    api_providers.removeProvider = function(appname, providername) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: '/studio/auth-providers',
            data:{
                action:             "remove",
                applicationName:    appname,
                provider:           providername

            }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });

        return deferred.promise;
    };


    return api_providers;
}]);

dfxStudioApi.factory('dfxViews', [ '$http', '$q', function($http, $q) {

    var api_views = {};

    api_views.getOne = function( scope, app_name, view_name, platform ) {
        // url: '/studio/widget/item/' + app_name + '/' + view_name  + '/' + view.platform
    	var deferred = $q.defer();
        
        $http({
  			method: 'GET',
  			url: '/studio/widget/item/' + app_name + '/' + view_name + '/' + platform
		}).then(function successCallback(response) {
        	deferred.resolve( response.data.widget );
        });
        
        return deferred.promise;
    };

    api_views.getByApp = function( scope, app_name, platform ) {
        // url: '/studio/widget/search/' + app_name + '/' + platform + '?q='
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: '/studio/widget/search/' + app_name + '/' + platform + '?q='
        }).then(function successCallback(response) {
            deferred.resolve( { "views": response.data.widgets } );
        });
        
        return deferred.promise;
    };

    api_views.update = function( scope, view ) {
        // add view.platform
        var deferred = $q.defer();

        delete view._id;
        
        $http({
            url: '/studio/widget/update/' + view.name,
            method: 'POST',
            data: {"change":view}
        }).then(function successCallback(response) {
            deferred.resolve( response.data );
        });
        
        return deferred.promise;
    }

    api_views.rename = function( scope, view ) {
        // add view,platform
        var deferred = $q.defer();

        $http({
            url: '/studio/widget/update/' + view.oldname,
            method: 'POST',
            data: {
                "change": {
                    "name": view.name,
                    "application": view.application,
                    "category": view.category,
                    "platform": view.platform,
                    "src_script": view.src_script
                }
            }
        }).then(function successCallback(response) {
            deferred.resolve( response.data );
        }, function failCallback(response) {
            deferred.reject( response );
        });

        return deferred.promise;
    }

    api_views.create = function( scope, view ) {
        var deferred = $q.defer();
        
        $http({
            url: '/studio/widget/create/',
            method: 'POST',
            data: view
        }).then(function successCallback(response) {
            deferred.resolve( response.data.widget );
        }, function errorCallback(response) {
            deferred.reject(response);
        });
        
        return deferred.promise;
    }

    api_views.delete = function( scope, view ) {
        // add view.platform
        var deferred = $q.defer();
        
        $http({
            url: '/studio/widget/delete/',
            method: 'POST',
            data: {
                "widgetName" : view.name,
                "applicationName" : view.application,
                "platform": view.platform
            }
        }).then(function successCallback(response) {
            deferred.resolve( response.data.widget );
        });
        
        return deferred.promise;
    }

    api_views.getCategories = function( scope, app_name, platform ) {
        // url: '/studio/widget/category/list/' + app_name + '/' + platform
        var deferred = $q.defer();
        
        $http({
            url: '/studio/widget/category/list/' + app_name + '/' + platform,
            method: 'GET',
            data: {}
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_views.createCategory = function( scope, category_name, app_name, platform ) {
        var deferred = $q.defer();
        
        $http({
            method: 'POST',
            url: '/studio/widget/category/createCategory',
            data: { name: category_name, ownerId: "", application: app_name, platform: platform }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_views.editCategory = function( scope, old_name, new_name, app_name, platform ) {
        // data: { name: new_name, application: app_name, platform : platform }
        var deferred = $q.defer();
        
        $http({
            method: 'POST',
            url: '/studio/widget/category/updateCategory/' + old_name,
            data: { name: new_name, application: app_name, platform : platform }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_views.removeCategory = function( scope, category_name, app_name, platform ) {
        // data: { name: category_name, ownerId: "", application: app_name, platform: platform }
        var deferred = $q.defer();
        
        $http({
            method: 'POST',
            url: '/studio/widget/category/removeCategory/' + category_name,
            data: { name: category_name, ownerId: "", application: app_name, platform: platform }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_views.createFromModel = function( scope, view ) {
        // Где это используется ? Нужно тоже добавить view.platform
        var deferred = $q.defer();
        
        $http({
            url: '/studio/widget/create-from-model/',
            method: 'POST',
            data: view
        }).then(function successCallback(response) {
            deferred.resolve( response.data.widget );
        }, function errorCallback(response) {
            deferred.reject(response);
        });
        
        return deferred.promise;
    }

    return api_views;
}]);

dfxStudioApi.factory('dfxPages', [ '$http', '$q', function($http, $q) {

    var api_pages = {};

    api_pages.getOne = function( scope, app_name, page_name, platform ) {
        // url: '/studio/screen/item/' + page_name + '/' + app_name + '/' + platform
    	var deferred = $q.defer();
        
        $http({
  			method: 'GET',
  			url: '/studio/screen/item/' + page_name + '/' + app_name + '/' + platform
		}).then(function successCallback(response) {
        	deferred.resolve( response.data.screen );
        });
        
        return deferred.promise;
    }

    api_pages.update = function( scope, page ) {
        // add page.platform
        var deferred = $q.defer();

        delete page._id;
        
        $http({
            url: '/studio/screen/update/',
            method: 'POST',
            data: {"change":page}
        }).then(function successCallback(response) {
            deferred.resolve( response.data );
        });
        
        return deferred.promise;
    }

    api_pages.delete = function( scope, page ) {
        // add page.platform
        var deferred = $q.defer();
        
        $http({
            url: '/studio/screen/delete/',
            method: 'POST',
            data: {
                "screenName" : page.name,
                "screenID" : page._id,
                "applicationName" : page.application,
                "platform": page.platform
            }
        }).then(function successCallback(response) {
            deferred.resolve( response.data.screen );
        });
        
        return deferred.promise;
    }

    api_pages.create = function( scope, page ) {
        // If no, then add page.platform
        var deferred = $q.defer();
        
        $http({
            url: '/studio/screen/create/',
            method: 'POST',
            data: page
        }).then(function successCallback(response) {
            deferred.resolve( response.data.screen );
        }, function errorCallback(response) {
            deferred.reject(response);
        });
        
        return deferred.promise;
    }

    api_pages.getCategories = function( scope, app_name, platform ) {
        // url: '/studio/screen-category/list/' + app_name + '/' + platform
        var deferred = $q.defer();
        
        $http({
            url: '/studio/screen-category/list/' + app_name + '/' + platform,
            method: 'GET'
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_pages.createCategory = function( scope, category_name, app_name, platform ) {
        var deferred = $q.defer();
        
        $http({
            method: 'POST',
            url: '/studio/screen-category/create',
            data: { name: category_name, application: app_name, title: category_name, platform: platform }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_pages.editCategory = function( scope, old_name, new_name, app_name, platform ) {
        //  data: { name: new_name, application: app_name, platform : platform }
        var deferred = $q.defer();
        
        $http({
            method: 'POST',
            url: '/studio/screen-category/update/' + old_name,
            data: { name: new_name, application: app_name, platform: platform }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_pages.removeCategory = function( scope, category_name, app_name, platform ) {
        // data: { applicationName: app_name, screenCategoryName: category_name, platform: platform }
        var deferred = $q.defer();
        
        $http({
            method: 'POST',
            url: '/studio/screen-category/delete/' + category_name,
            data: { applicationName: app_name, screenCategoryName: category_name, platform: platform }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_pages.preview = function( url ) {
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: url
        }).then(function successCallback(response) {
            deferred.resolve( response );
        },function errorCallback(err){
            deferred.reject(err);
        });

        return deferred.promise;
    }

    return api_pages;
}]);

dfxStudioApi.factory('dfxTemplates', [ '$http', '$q', function($http, $q) {

    var api_templates = {};

    api_templates.getOne = function( scope, app_name, template_name ) {
        var deferred = $q.defer();
        
        $http({
            method: 'GET',
            url: '/studio/screentemplates/item/' + template_name + '/' + app_name
        }).then(function successCallback(response) {
            deferred.resolve(response.data.screenTemplate);
        });
        
        return deferred.promise;
    };

    api_templates.getAll = function( scope, app_name ) {
        var deferred = $q.defer();
        
        $http({
            method: 'GET',
            url: '/studio/screentemplates/list/' + app_name
        }).then(function successCallback(response) {
            deferred.resolve(response.data.screens_templates);
        });
        
        return deferred.promise;
    };

    api_templates.create = function( scope, template ) {
        var deferred = $q.defer();

        delete template._id;
        
        $http({
            url: '/studio/screentemplates/create/',
            method: 'POST',
            data: template
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_templates.update = function( scope, template ) {
        var deferred = $q.defer();

        delete template._id;
        
        $http({
            url: '/studio/screentemplates/update/',
            method: 'POST',
            data: {"change":template}
        }).then(function successCallback(response) {
            deferred.resolve( response.data.screenTemplate );
        });
        
        return deferred.promise;
    }

    return api_templates;
}]);

dfxStudioApi.factory('dfxAppRoles', [ '$http', '$q', function($http, $q) {

    var api_roles = {};

    api_roles.getAll = function( scope, app_name ) {
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: '/studio/roles/' + app_name + '/search?q='
        }).then(function successCallback(response) {
            deferred.resolve( response.data.roles );
        });

        return deferred.promise;
    };

    api_roles.getAllRights = function( scope, app_name ) {
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: '/studio/query/list-by-app/' + app_name
        }).then(function successCallback(response) {
            var dataqueries = response.data.queries;

            deferred.resolve( dataqueries );
        });

        return deferred.promise;
    };

    api_roles.edit = function( scope, app_name, role_name ) {
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: '/studio/query/list-by-app/' + app_name
        }).then(function successCallback(response) {
            var dataqueries = response.data.queries;

            $http({
                url: '/studio/roles/get',
                method: 'POST',
                data: {
                    tenant:      scope.tenant_id,
                    application: app_name,
                    name:        role_name
                }
            }).then(function successCallback(response) {
                var role = response.data;
                role.all_dataqueries = dataqueries;

                //TODO: check if getRights is not redundant because we already have rights in role object
                $http({
                    url: '/studio/roles/getRights',
                    method: 'POST',
                    data: {
                        tenant:      scope.tenant_id,
                        application: app_name,
                        role:        role_name
                    }
                }).then(function successCallback(response) {
                    role.rights = response.data;
                    console.log('role: ', role);

                    deferred.resolve( role );
                });
            });
        });

        return deferred.promise;
    };

    api_roles.update = function( scope, to_update ) {
        var deferred = $q.defer();

        var data = {
            name:        to_update.name,
            application: to_update.app_name,
            description: to_update.description
        };
        if (to_update.rights && to_update.rights.length > 0) {
            data.rights = to_update.rights;//need to pass rights to server only if there are checked ones
        }

        $http({
            url: '/studio/roles/update',
            method: 'POST',
            data: data
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });

        return deferred.promise;
    };

    api_roles.create = function( scope, to_update ) {
        var deferred = $q.defer();

        var data = {
            tenant:      scope.tenant_id,
            name:        to_update.name,
            application: to_update.app_name,
            description: to_update.description
        };
        if (to_update.rights && to_update.rights.length > 0) {
            data.rights = to_update.rights;//need to pass rights to server only if there are checked ones
        }

        $http({
            url: '/studio/roles/create',
            method: 'POST',
            data: data
        }).then(function successCallback(response) {
            deferred.resolve( response );
        }, function failCallback(response) {
            deferred.reject( response );
        });

        return deferred.promise;
    };

    api_roles.delete = function( scope, app_name, role_name ) {
        var deferred = $q.defer();

        $http({
            url: '/studio/roles/remove',
            method: 'POST',
            data: {
                name:        role_name,
                application: app_name
            }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });

        return deferred.promise;
    };

    return api_roles;
}]);

dfxStudioApi.factory('dfxAppUsers', [ '$http', '$q', function($http, $q) {

    var api_users = {};

    api_users.getAll = function( scope, app_name ) {
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: '/studio/users/' + app_name + '/search?q='
        }).then(function successCallback(response) {
            deferred.resolve( response.data.users );
        });

        return deferred.promise;
    };

    api_users.getAllRoles = function( scope, app_name ) {
        var deferred = $q.defer();

        $http({
            url: '/studio/roles/list',
            method: 'POST',
            data: {
                application: app_name
            }
        }).then(function successCallback(response) {
            deferred.resolve( response.data.data );
        });

        return deferred.promise;
    };

    api_users.edit = function( scope, app_name, user_login ) {
        var deferred = $q.defer();

        $http({
            url: '/studio/roles/list',
            method: 'POST',
            data: {
                application: app_name
            }
        }).then(function successCallback(response) {
            var all_roles = response.data.data;

            $http({
                url: 'metadata/user_definition/' + app_name,
                method: 'GET'
            }).then(function successCallback(response) {
                var user_def = response.data;

                $http({
                    url: '/studio/users/get',
                    method: 'POST',
                    data: {
                        tenant:      scope.tenant_id,
                        application: app_name,
                        login:       user_login
                    }
                }).then(function successCallback(response) {
                    var user = response.data.data;
                    user.all_roles = all_roles;
                    user.user_def = user_def;

                    deferred.resolve( user );
                });
            });
        });

        return deferred.promise;
    };

    api_users.update = function( scope, to_update, new_pass, pass_changed ) {
        var deferred = $q.defer();

        var data = {
            tenant:      scope.tenant_id,
            application: to_update.app_name,
            login:       to_update.login,
            firstName:   to_update.firstName,
            lastName:    to_update.lastName,
            email:       to_update.email,
            roles:       to_update.roles,
            properties:  to_update.properties
        };

        if (pass_changed) data.pass = new_pass;

        $http({
            url: '/studio/users/update',
            method: 'POST',
            data: data
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });

        return deferred.promise;
    };

    api_users.create = function( scope, to_create ) {
        var deferred = $q.defer();

        var data = {
            kind:        'application',
            type:        '',
            tenant:      scope.tenant_id,
            application: to_create.app_name,
            login:       to_create.login,
            firstName:   to_create.firstName,
            lastName:    to_create.lastName,
            email:       to_create.email,
            pass:        to_create.new_pass,
            roles:       to_create.roles,
            properties:  to_create.properties
        };

        $http({
            url: '/studio/users/create',
            method: 'POST',
            data: data
        }).then(function successCallback(response) {
            deferred.resolve( response.config.data );
        }, function failCallback(response) {
            deferred.reject( response );
        });

        return deferred.promise;
    };

    api_users.delete = function( scope, app_name, user_login ) {
        var deferred = $q.defer();

        $http({
            url: '/studio/users/remove',
            method: 'POST',
            data: {
                login:       user_login,
                application: app_name
            }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });

        return deferred.promise;
    };

    return api_users;
}]);

dfxStudioApi.factory('dfxUserDefinition', [ '$http', '$q', function($http, $q) {

    var api_user_def = {};

    api_user_def.getUserDefinition = function( scope, app_name ) {
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: 'metadata/user_definition/' + app_name
        }).then(function successCallback(response) {
            deferred.resolve( response.data );
        });

        return deferred.promise;
    };

    api_user_def.updateUserDefinition = function( scope, app_name, user_definition ) {
        var deferred = $q.defer();

        var data = angular.copy(user_definition);
        data.applicationName = app_name;

        $http({
            url: '/studio/metadata/user_definition/update',
            method: 'POST',
            data: data
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });

        return deferred.promise;
    };

    return api_user_def;
}]);

dfxStudioApi.factory('dfxApiServiceObjects', [ '$http', '$q', function($http, $q) {

    var api_service_objects = {};

    //api_service_objects.execute = function( simulateService ) {
    //    var deferred = $q.defer();
    //
    //    $http.get('/studio/query/execute', { 'params' : simulateService }).then(function successCallback(response) {
    //        deferred.resolve( response );
    //    });
    //
    //    return deferred.promise;
    //}

    api_service_objects.getTenant = function(tenantId) {
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: '/api/tenant/get?tenantid=' + tenantId
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });

        return deferred.promise;
    }

    api_service_objects.getAll = function( scope, app_name ) {
        var deferred = $q.defer();
        
        $http({
            method: 'POST',
            url: '/studio/auth-providers',
            data: { action: "fullList", getCreds : true, applicationName : app_name }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_service_objects.getOne = function( scope, app_name, api_so_name ) {
        var deferred = $q.defer();
        
        $http({
            method: 'GET',
            url: '/studio/query/dataNew/' + app_name + '/' + api_so_name
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_service_objects.getCategories = function( scope, app_name ) {
        var deferred = $q.defer();
        
        $http({
            method: 'GET',
            url: '/studio/query/category/list/' + app_name
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_service_objects.createCategory = function( scope, category_name, app_name ) {
        var deferred = $q.defer();
        
        $http({
            method: 'POST',
            url: '/studio/query/category/createCategory',
            data: { name: category_name, ownerId: "", application: app_name }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_service_objects.editCategory = function( scope, old_name, new_name, app_name ) {
        var deferred = $q.defer();
        
        $http({
            method: 'POST',
            url: '/studio/query/category/updateCategory/' + old_name,
            data: { name: new_name, application: app_name }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_service_objects.removeCategory = function( scope, category_name, app_name ) {
        var deferred = $q.defer();
        
        $http({
            method: 'POST',
            url: '/studio/query/category/removeCategory/' + category_name,
            data: { name: category_name, ownerId: "", application: app_name }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_service_objects.createSo = function( scope, so ) {
        var deferred = $q.defer();

        $http({
            method: 'POST',
            url: '/studio/query/create/' + so.name,
            data: so
        }).then(function successCallback(response) {
            deferred.resolve( response );
        }, function errorCallback(response){
            deferred.reject( response );
        });
        
        return deferred.promise;
    }

    api_service_objects.updateSo = function( scope, so ) {
        var deferred = $q.defer();

        $http({
            method: 'POST',
            url: '/studio/query/update/' + so.name,
            data: so
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_service_objects.renameSo = function( scope, so, oldName ) {
        var deferred = $q.defer();

        $http({
            method: 'POST',
            url: '/studio/query/update/' + oldName,
            data: so
        }).then(function successCallback(response) {
            deferred.resolve( response );
        }, function errorCallback(response){
            deferred.reject( response );
        });

        return deferred.promise;
    }

    api_service_objects.deleteSo = function( scope, so ) {
        var deferred = $q.defer();
        
        $http({
            url: '/studio/query/delete/',
            method: 'POST',
            data: {
                "queryName" : so.name,
                "applicationName" : so.application,
            }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_service_objects.validateSoName = function( scope, api_so_name, app_name ) {
        var deferred = $q.defer();
        
        $http({
            method: 'POST',
            url: '/studio/query/validateServiceName',
            data: { name: api_so_name, applicationName: app_name }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_service_objects.validateSoUrl = function( scope, api_route, app_name, route_id ) {
        var deferred = $q.defer();
        
        $http({
            method: 'POST',
            url: '/studio/query/validateServiceUrl',
            data: { name: api_route, applicationName: app_name, uuid: route_id }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_service_objects.getCatalog = function( scope ) {
        var deferred = $q.defer();
        
        $http({
            method: 'GET',
            url: '/src/catalog/datasources.json'
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_service_objects.getStrongLoop = function( scope, server_url ) {
        var deferred = $q.defer();
        
        $http({
            method: 'GET',
            url: server_url + '/explorer/swagger.json'
        }).then(function successCallback(response) {
            deferred.resolve( response );
        });
        
        return deferred.promise;
    }

    api_service_objects.clearCache = function( o ) {
        var deferred = $q.defer();

        $http({
            method: 'POST',
            url: '/studio/query/clearCache',
            data: { type : o.type, application : o.application, name : o.name }
        }).then(function successCallback(response) {
            deferred.resolve( response );
        },function negativeCallback(err){
            deferred.reject( err );
        });

        return deferred.promise;
    }

    return api_service_objects;
}]);

dfxStudioApi.factory('dfxSamples', [ '$http', '$q', function($http, $q) {

    var api_samples = {};

    api_samples.contents = function( scope, path ) {
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: 'samples/contents',
            params: {'path': path}
        }).then(function successCallback(response) {
            deferred.resolve( response.data );
        });

        return deferred.promise;
    };

    return api_samples;
}]);

var dfxStudioApp = angular.module("dfxStudioApp", ['ngRoute', 'ngMaterial', 'dfxStudioApi', 'nvd3', 'monospaced.qrcode', 'nsPopover']);

dfxStudioApp.config([ '$routeProvider', '$mdThemingProvider', function($routeProvider, $mdThemingProvider) {

    $routeProvider
        .when('/settings', {
            controller: 'dfx_studio_settings_controller',
            templateUrl: 'studioviews/settings.html'
        })
        .when('/home', {
            controller: 'dfx_studio_home_controller',
            templateUrl: 'studioviews/home.html'
        })
        .when('/release-notes', {
            controller: 'dfx_studio_release_notes_controller',
            templateUrl: 'studioviews/release_notes.html'
        })
        .when('/samples', {
            controller: 'dfx_studio_samples_controller',
            templateUrl: 'studioviews/samples.html'
        })
        .when('/support', {
            controller: 'dfx_studio_support_controller',
            templateUrl: 'studioviews/support.html'
        })
        .when('/contactus', {
            controller: 'dfx_studio_contactus_controller',
            templateUrl: 'studioviews/contactus.html'
        })
        .when('/stackoverflow', {
            controller: 'dfx_studio_stackoverflow_controller',
            templateUrl: 'studioviews/stackoverflow.html'
        })
        .when('/search/:searchquery', {
            controller: 'dfx_studio_search_controller',
            templateUrl: 'studioviews/search.html'
        })
        .when('/application/create', {
            controller: 'dfx_studio_new_application_controller',
            templateUrl: 'studioviews/create_app.html'
        })
        .when('/:appname/configuration/:settings', {
            controller: 'dfx_studio_configuration_controller',
            templateUrl: 'studioviews/configuration.html'
        })
        .when('/page/create/:appname/:platform', {
            controller: 'dfx_studio_page_create_controller',
            templateUrl: 'studioviews/page_create.html'
        })
        .when('/page/create/:appname/:platform/:categoryname', {
            controller: 'dfx_studio_page_create_controller',
            templateUrl: 'studioviews/page_create.html'
        })
        .when('/page/update/:appname/:platform/:pagename', {
            controller: 'dfx_studio_page_controller',
            templateUrl: 'studioviews/page.html'
        })
        .when('/pages_categories/:app_name/:platform', {
            controller: 'dfx_studio_page_category_controller',
            templateUrl: 'studioviews/pages_categories.html'
        })
        .when('/view/create/:appname/:platform', {
            controller: 'dfx_studio_view_create_controller',
            templateUrl: 'studioviews/view_create.html'
        })
        .when('/view/create/:appname/:platform/:categoryname', {
            controller: 'dfx_studio_view_create_controller',
            templateUrl: 'studioviews/view_create.html'
        })
        .when('/view/update/:appname/:platform/:viewname', {
            controller: 'dfx_studio_view_controller',
            templateUrl: 'studioviews/view.html'
        })
        .when('/views_categories/:app_name/:platform', {
            controller: 'dfx_studio_view_category_controller',
            templateUrl: 'studioviews/views_categories.html'
        })
        .when('/api_so/create/:appname', {
            controller: 'dfx_studio_api_so_controller',
            templateUrl: 'studioviews/api_so.html'
        })
        .when('/api_so/create/:appname/:categoryname', {
            controller: 'dfx_studio_api_so_controller',
            templateUrl: 'studioviews/api_so.html'
        })
        .when('/api_so/update/:appname/:api_so_name', {
            controller: 'dfx_studio_api_so_controller',
            templateUrl: 'studioviews/api_so.html'
        })
        .when('/api_so_categories/:appname', {
            controller: 'dfx_studio_api_so_category_controller',
            templateUrl: 'studioviews/api_so_categories.html'
        })
        .when('/category/pages/:appname/:platform', {
            controller: 'dfx_studio_category_controller',
            templateUrl: 'studioviews/category.html'
        })
        .when('/category/views/:appname/:platform', {
            controller: 'dfx_studio_category_controller',
            templateUrl: 'studioviews/category.html'
        })
        .when('/category/api_so/:appname', {
            controller: 'dfx_studio_category_controller',
            templateUrl: 'studioviews/category.html'
        })
        .when('/category/pages/:appname/:platform/:categoryname', {
            controller: 'dfx_studio_category_controller',
            templateUrl: 'studioviews/category.html'
        })
        .when('/category/views/:appname/:platform/:categoryname', {
            controller: 'dfx_studio_category_controller',
            templateUrl: 'studioviews/category.html'
        })
        .when('/category/api_so/:appname/:categoryname', {
            controller: 'dfx_studio_category_controller',
            templateUrl: 'studioviews/category.html'
        })
        .when('/platform/:section', {
            controller: 'dfx_studio_platform_controller',
            templateUrl: 'studioviews/platform.html'
        })
        .when('/categories/:entity/:appname', {
         controller: 'dfx_studio_home_controller',
         templateUrl: 'studioviews/views_pages_apiso.html'
         })
        .otherwise('/home', {
            controller: 'dfx_studio_home_controller',
            templateUrl: 'studioviews/home.html'
        })

    $mdThemingProvider.theme('altTheme')
        .primaryPalette('blue') // specify primary color, all
    // other color intentions will be inherited
    // from default
    $mdThemingProvider.setDefaultTheme('altTheme');
}]);

dfxStudioApp.controller("dfx_studio_controller", [ '$scope', '$rootScope', '$mdDialog', '$mdSidenav', '$mdMedia', '$location', '$window', '$compile', 'dfxApplications', 'dfxPages', 'dfxViews', 'dfxApiServiceObjects', 'dfxMessaging', '$routeParams', '$timeout', '$q', '$route', function($scope, $rootScope, $mdDialog, $mdSidenav, $mdMedia, $location, $window, $compile, dfxApplications, dfxPages, dfxViews, dfxApiServiceObjects, dfxMessaging, $routeParams, $timeout, $q, $route) {
    $scope.tenant_id = $('#dfx-studio-main-body').attr( 'data-tenantid' );
    $scope.studio_explorer_visible = true;
    $scope.dfx_version_major   = '3';
    $scope.dfx_version_minor   = '02';
    $scope.dfx_version_release = 'R6';

    $scope.initStudio = function() {
        return '/studio/home';
    };

    $scope.resourcesClick = function() {
        $scope.resourcesPath = "studioviews/resources.html";
        $scope.javascript = {};
        $scope.dictionary = {};
        $scope.stylesheets = {};
        $scope.assets = {};
    }

    $scope.loadStudioView = function(path) {
        $location.path(path);
    };

    $scope.redirectDocumentation = function(){
        $window.open("http://interactive-clouds.com/documentation/", "_blank") ;
    };    

    $scope.signOut = function(path) {
        $window.location.href = '/studio/' + $scope.tenant_id + '/login';
    };

    $scope.refreshSupportForm = function(){
        var sup_scope = angular.element(document.getElementById('support-scope-id')).scope();
        if(sup_scope){
            sup_scope.refreshForm();
        }
    };

    $rootScope.$on('$routeChangeSuccess', function(scope, next, current){
        $scope.settings = $routeParams.settings;
        $scope.platform_section = $routeParams.section;
    });

    $rootScope.$on('$routeChangeStart', function(scope, next, current){
        $scope.settings = $routeParams.settings;
        $scope.platform_section = $routeParams.section;
    });

    $scope.getAll = function(){
        dfxApplications.getAll($scope).then(function(apps){
            $scope.applications = apps.data;
            $scope.appTrees = [];
            for(var i =0; i < $scope.applications.length; i++){
                $scope.appTrees.push({});
            }
            for(var j =0; j < $scope.applications.length; j++){
                (function(){
                    var local = j;
                    dfxApplications.getAppTree($scope, $scope.applications[local].name).then(function(appTree){
                        $scope.appTrees[local] = appTree;
                    })
                })();
            }
        });
        return $q.when($scope.applications);
    };
    $scope.getAll();

    $scope.toggleLeft = function() {
        $scope.studio_explorer_visible = !$scope.studio_explorer_visible;
        if ($scope.studio_explorer_visible) {
            $('#dfx-studio-toggle-explorer-icon').addClass('fa-angle-double-left');
            $('#dfx-studio-toggle-explorer-icon').removeClass('fa-angle-double-right');
            $('#dfx-studio-explorer-title').removeClass('dfx-studio-explorer-title-collapsed');
            $('#dfx-studio-explorer-title-text').removeClass('dfx-studio-explorer-title-text-collapsed');
        } else {
            $('#dfx-studio-explorer-title').addClass('dfx-studio-explorer-title-collapsed');
            $('#dfx-studio-explorer-title-text').addClass('dfx-studio-explorer-title-text-collapsed');
            $('#dfx-studio-toggle-explorer-icon').removeClass('fa-angle-double-left');
            $('#dfx-studio-toggle-explorer-icon').addClass('fa-angle-double-right');
        }
    };

    $scope.loadExplorerMenu = function($event, entity, element, category, type, name, platform) {
        $scope.platform = platform;
        $event.stopImmediatePropagation();
        $scope.closeExplorerMenu();
        $scope.isHomePage = false;
        var snippet = '<md-menu-content width="4" style="left:'+($event.x-5)+'px;top:'+($event.y-5)+'px;" layout="column" class="md-whiteframe-4dp dfx-studio-explorer-popmenu md-menu-bar-menu md-dense .md-button" ng-mouseleave="closeExplorerMenu()">';
        if (entity=='application') {
            snippet += '<md-menu-item><md-button ng-href="#/application/create"><md-icon class="fa fa-plus" aria-label="Create a new Application"></md-icon>Create a new Application</md-button></md-menu-item>';
        } else if (entity=='page') {
            snippet +=  '<md-menu-item><md-button ng-href="#/page/create/'+element+'/'+platform+'"><md-icon class="fa fa-plus" aria-label="Create Page"></md-icon>Create Page</md-button></md-menu-item><md-menu-item><md-button ng-href="#/pages_categories/'+element+'/'+platform+'"><md-icon class="fa fa-list" aria-label="Manage Categories"></md-icon>Manage Categories</md-button></md-menu-item>';
        } else if (entity=='view') {
            snippet +=  '<md-menu-item><md-button ng-href="#/view/create/'+element+'/'+platform+'"><md-icon class="fa fa-plus" aria-label="Create View"></md-icon>Create View</md-button></md-menu-item><md-menu-item><md-button ng-href="#/views_categories/'+element+'/'+platform+'"><md-icon class="fa fa-list" aria-label="Manage Categories"></md-icon>Manage Categories</md-button></md-menu-item>';
        } else if (entity=='api_so') {
            snippet +=  '<md-menu-item><md-button ng-href="#/api_so/create/'+element+'"><md-icon class="fa fa-plus" aria-label="Create API Service Object"></md-icon>Create API Service Object</md-button></md-menu-item><md-menu-item><md-button ng-href="#/api_so_categories/'+element+'"><md-icon class="fa fa-list" aria-label="Manage Categories"></md-icon>Manage Categories</md-button></md-menu-item>';
        } else if (entity=='category') {
            $scope.cat_app = element;
            $scope.cat_name = category;
            $scope.cat_type = type;
            $scope.cat_platform = platform;
            if ( category === 'Default' ) {
                switch ( type ) {
                    case 'page':  snippet += '<md-menu-item><md-button ng-href="#/category/pages/'+element+'/'+platform+'"><md-icon class="fa fa-list-alt" aria-label="List Pages"></md-icon>List Pages</md-button></md-menu-item>' +
                                             '<md-menu-item><md-button ng-href="#/page/create/'+element+'/'+platform+'"><md-icon class="fa fa-plus" aria-label="Create Page"></md-icon>Create Page</md-button></md-menu-item>' +
                                             '<md-menu-item><md-button ng-click="copyCatBtn($event)"><md-icon class="fa fa-copy" aria-label="Copy"></md-icon>Copy Category to ...</md-button></md-menu-item>'; break;
                    case 'view':  snippet += '<md-menu-item><md-button ng-href="#/category/views/'+element+'/'+platform+'"><md-icon class="fa fa-list-alt" aria-label="List Views"></md-icon>List Views</md-button></md-menu-item>' +
                                             '<md-menu-item><md-button ng-href="#/view/create/'+element+'/'+platform+'"><md-icon class="fa fa-plus" aria-label="Create View"></md-icon>Create View</md-button></md-menu-item>' +
                                             '<md-menu-item><md-button ng-click="copyCatBtn($event)"><md-icon class="fa fa-copy" aria-label="Copy"></md-icon>Copy Category to ...</md-button></md-menu-item>'; break;
                    case 'apiso': snippet += '<md-menu-item><md-button ng-href="#/category/api_so/'+element+'"><md-icon class="fa fa-list-alt" aria-label="List API SOs"></md-icon>List API SOs</md-button></md-menu-item>' +
                                             '<md-menu-item><md-button ng-href="#/api_so/create/'+element+'"><md-icon class="fa fa-plus" aria-label="Create API Service Object"></md-icon>Create API Service Object</md-button></md-menu-item>' +
                                             '<md-menu-item><md-button ng-click="copyCatBtn($event)"><md-icon class="fa fa-copy" aria-label="Copy"></md-icon>Copy Category to ...</md-button></md-menu-item>'; break;
                }
            } else {
                switch ( type ) {
                    case 'page':  snippet += '<md-menu-item><md-button ng-href="#/category/pages/'+element+'/'+platform+'/'+category+'"><md-icon class="fa fa-list-alt" aria-label="List Pages"></md-icon>List Pages</md-button></md-menu-item>' +
                                             '<md-menu-item><md-button ng-href="#/page/create/'+element+'/'+platform+'/'+category+'"><md-icon class="fa fa-plus" aria-label="Create Page"></md-icon>Create Page</md-button></md-menu-item>' +
                                             '<md-menu-item><md-button ng-click="renameCategoryBtn($event)"><md-icon class="fa fa-retweet" aria-label="Rename"></md-icon>Rename Category</md-button></md-menu-item>' +
                                             '<md-menu-item><md-button ng-click="copyCatBtn($event)"><md-icon class="fa fa-copy" aria-label="Copy"></md-icon>Copy Category to ...</md-button></md-menu-item>' +
                                             '<md-menu-item><md-button ng-click="confirmDelete($event)"><md-icon class="fa fa-trash" aria-label="Delete"></md-icon>Delete Category</md-button></md-menu-item>'; break;
                    case 'view':  snippet += '<md-menu-item><md-button ng-href="#/category/views/'+element+'/'+platform+'/'+category+'"><md-icon class="fa fa-list-alt" aria-label="List Views"></md-icon>List Views</md-button></md-menu-item>' +
                                             '<md-menu-item><md-button ng-href="#/view/create/'+element+'/'+platform+'/'+category+'"><md-icon class="fa fa-plus" aria-label="Create View"></md-icon>Create View</md-button></md-menu-item>' +
                                             '<md-menu-item><md-button ng-click="renameCategoryBtn($event)"><md-icon class="fa fa-retweet" aria-label="Rename"></md-icon>Rename Category</md-button></md-menu-item>' +
                                             '<md-menu-item><md-button ng-click="copyCatBtn($event)"><md-icon class="fa fa-copy" aria-label="Copy"></md-icon>Copy Category to ...</md-button></md-menu-item>' +
                                             '<md-menu-item><md-button ng-click="confirmDelete($event)"><md-icon class="fa fa-trash" aria-label="Delete"></md-icon>Delete Category</md-button></md-menu-item>'; break;
                    case 'apiso': snippet += '<md-menu-item><md-button ng-href="#/category/api_so/'+element+'/'+category+'"><md-icon class="fa fa-list-alt" aria-label="List API SOs"></md-icon>List API SOs</md-button></md-menu-item>' +
                                             '<md-menu-item><md-button ng-href="#/api_so/create/'+element+'/'+category+'"><md-icon class="fa fa-plus" aria-label="Create API Service Object"></md-icon>Create API Service Object</md-button></md-menu-item>' +
                                             '<md-menu-item><md-button ng-click="renameCategoryBtn($event)"><md-icon class="fa fa-retweet" aria-label="Rename"></md-icon>Rename Category</md-button></md-menu-item>' +
                                             '<md-menu-item><md-button ng-click="copyCatBtn($event)"><md-icon class="fa fa-copy" aria-label="Copy"></md-icon>Copy Category to ...</md-button></md-menu-item>' +
                                             '<md-menu-item><md-button ng-click="confirmDelete($event)"><md-icon class="fa fa-trash" aria-label="Delete"></md-icon>Delete Category</md-button></md-menu-item>'; break;
                }
            }            
        } else if (entity === 'menuItem') {
            $scope.targetComponent = {
                "name":        name,
                "application": element,
                "category":    category,
                "type":        type,
                "platform":    platform
            }
            if ( name === 'Home' && category === 'Default' && type === 'page' ) {
                $scope.isHomePage = true;
            }
            switch (type) {
                case 'page':  snippet +=  '<md-menu-item><md-button ng-click="copyToBtn($event)"><md-icon class="fa fa-copy" aria-label="Copy"></md-icon>Copy to ...</md-button></md-menu-item>' +
                                          '<md-menu-item ng-if="!(isHomePage)"><md-button ng-click="moveToBtn($event)"><md-icon class="fa fa-exchange" aria-label="Move"></md-icon>Move to ...</md-button></md-menu-item>'; break;
                case 'view':  snippet +=  '<md-menu-item><md-button ng-click="renameViewBtn($event)"><md-icon class="fa fa-retweet" aria-label="Rename"></md-icon>Rename</md-button></md-menu-item>' +
                                          '<md-menu-item><md-button ng-click="copyToBtn($event)"><md-icon class="fa fa-copy" aria-label="Copy"></md-icon>Copy to ...</md-button></md-menu-item>' +
                                          '<md-menu-item><md-button ng-click="moveToBtn($event)"><md-icon class="fa fa-exchange" aria-label="Move"></md-icon>Move to ...</md-button></md-menu-item>'; break;
                case 'apiso':  snippet += '<md-menu-item><md-button ng-click="copyToBtn($event)"><md-icon class="fa fa-copy" aria-label="Copy"></md-icon>Copy to ...</md-button></md-menu-item>' +
                                          '<md-menu-item><md-button ng-click="moveToBtn($event)"><md-icon class="fa fa-exchange" aria-label="Move"></md-icon>Move to ...</md-button></md-menu-item>'; break;
            }

        }
        snippet += '</md-menu-content>';
        angular.element(document.getElementById('dfx-studio-main-body')).append($compile(snippet)($scope));
    };

    $scope.closeExplorerMenu = function($event) {
        $('.dfx-studio-explorer-popmenu').remove();
    };

    $scope.renameCategoryBtn = function($event) {
        var parentEl = angular.element(document.body);
        
        $mdDialog.show({
            parent: parentEl,
            targetEvent: $event,
            clickOutsideToClose: true,
            scope: $scope.$new(),
            templateUrl: 'studioviews/category_rename.html',
            controller: DialogController
        });
        
        function DialogController($scope, $mdDialog) {
            $scope.renameCategory = function( newName ) {
                if ( (newName !== '') && (/^[-a-zA-Z0-9_]+$/.test( newName )) ) {
                    if ( $scope.cat_type === 'page' ) {                
                        dfxPages.editCategory( $scope, $scope.cat_name, newName, $scope.cat_app, $scope.cat_platform ).then(function( data ) {
                            if ( data.data.data !== 'Current category name already exists!' ) {
                                dfxMessaging.showMessage(data.data.data);                                
                                $scope.getAll();
                                $route.reload();
                                $mdDialog.hide();
                            } else {
                                dfxMessaging.showWarning(data.data.data);
                            }
                        });
                    } else if ( $scope.cat_type === 'view' ) {                
                        dfxViews.editCategory( $scope, $scope.cat_name, newName, $scope.cat_app, $scope.cat_platform ).then(function( data ) {
                            if ( data.data.data !== 'Current category name already exists!' ) {
                                dfxMessaging.showMessage(data.data.data);                                
                                $scope.getAll();
                                $route.reload();
                                $mdDialog.hide();
                            } else {
                                dfxMessaging.showWarning(data.data.data);
                            }
                        });
                    } else if ( $scope.cat_type === 'apiso' ) {                
                        dfxApiServiceObjects.editCategory( $scope, $scope.cat_name, newName, $scope.cat_app ).then(function( data ) {                            
                            if ( data.data.data !== 'Current category name already exists!' ) {
                                dfxMessaging.showMessage(data.data.data);                                
                                $scope.getAll();
                                $route.reload();
                                $mdDialog.hide();
                            } else {
                                dfxMessaging.showWarning(data.data.data);
                            }
                        });
                    }
                } else {
                    dfxMessaging.showWarning('Not valid Category Name');
                }
            }
            
            $scope.closeDialog = function() {
                $mdDialog.hide();
            }
        }
    }

    $scope.deleteCategory = function() {
        if ( $scope.cat_type === 'page' ) {
            dfxPages.removeCategory( $scope, $scope.cat_name, $scope.cat_app, $scope.cat_platform ).then(function( data ) {
                if ( data.status && data.status === 200 ) {
                    dfxMessaging.showMessage(data.data.data);
                    $scope.getAll();
                    $route.reload();
                } else {
                    dfxMessaging.showWarning(data.data.data);
                }
            });
        } else if ( $scope.cat_type === 'view' ) {                
            dfxViews.removeCategory( $scope, $scope.cat_name, $scope.cat_app, $scope.cat_platform ).then(function( data ) {
                if ( data.status && data.status === 200 ) {
                    dfxMessaging.showMessage(data.data.data);
                    $scope.getAll();
                    $route.reload();
                } else {
                    dfxMessaging.showWarning(data.data.data);
                }
            });
        } else if ( $scope.cat_type === 'apiso' ) {                
            dfxApiServiceObjects.removeCategory( $scope, $scope.cat_name, $scope.cat_app ).then(function( data ) {
                if ( data.status && data.status === 200 ) {
                    dfxMessaging.showMessage(data.data.data);
                    $scope.getAll();
                    $route.reload();
                } else {
                    dfxMessaging.showWarning(data.data.data);
                }
            });
        }
    }

    $scope.confirmDelete = function($event) {
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want to remove this category?')
            .textContent('Category will be removed from the repository.')
            .ariaLabel('remove service')
            .targetEvent($event)
            .cancel('Cancel')
            .ok('OK');
        $mdDialog.show(confirm).then(function() {
            $scope.deleteCategory();
        }, function() {
        });
    }

    $scope.renameViewBtn = function($event) {
        var parentEl = angular.element(document.body);

        $mdDialog.show({
            parent: parentEl,
            targetEvent: $event,
            clickOutsideToClose: true,
            scope: $scope.$new(),
            templateUrl: 'studioviews/view_rename.html',
            controller: DialogController
        });

        function DialogController($scope, $mdDialog) {
            $scope.rename = function( newName ) {
                var testName = /^[-a-zA-Z0-9_]+$/.test( newName );

                if ( newName && testName ) {
                    dfxViews.getOne( $scope, $scope.targetComponent.application, $scope.targetComponent.name, $scope.targetComponent.platform ).then( function(data) {
                        var to_rename = {
                            "name": $scope.newName.value,
                            "oldname": data.name,
                            "application": data.application,
                            "category": data.category,
                            "platform": data.platform,
                            "src_script": data.src_script
                        }
                        dfxViews.rename( $scope, to_rename ).then( function(data) {
                            dfxMessaging.showMessage('View has been successfully renamed');
                            $scope.getAll();
                            $mdDialog.hide();
                            if ( $location.$$path === ('/view/update/' + to_rename.application + '/' + to_rename.oldname) ) {
                                $location.path('/view/update/' + to_rename.application + '/' + to_rename.name);
                            }
                        }, function(data) {
                            dfxMessaging.showWarning('View with name "' + newName + '" already exists');
                        });
                    });
                } else {
                    dfxMessaging.showWarning('Not valid View Name');
                }
            }

            $scope.closeDialog = function () {
                $mdDialog.hide();
            }

        }
    }

    $scope.copyToBtn = function($event, callback) {
        var parentEl = angular.element(document.body);

        $mdDialog.show({
            parent: parentEl,
            targetEvent: $event,
            clickOutsideToClose: true,
            scope: $scope.$new(),
            templateUrl: 'studioviews/copy_component_dialog.html',
            controller: DialogController
        });

        function DialogController($scope, $mdDialog) {
            $scope.toCopy = {
                "name":              $scope.targetComponent.name,
                "application":       $scope.targetComponent.application,
                "applicationTarget": $scope.targetComponent.application,
                "queryName":         $scope.targetComponent.name,
                "categoryTarget":    $scope.targetComponent.category,
                "type":              "",
                "platform":          $scope.targetComponent.platform
            }
            $scope.validPrefix = true;

            $scope.chooseCategories = function( appName ) {
                $scope.categories = [];
                $scope.appAllRoutes = [];
                dfxApplications.getAppTree( $scope, appName ).then(function( data ) {
                    switch ( $scope.targetComponent.type ) {
                        case 'page': for ( var cat in data.data['pages'][$scope.targetComponent.platform] ) { $scope.categories.push(cat); } break;
                        case 'view': for ( var cat in data.data['views'][$scope.targetComponent.platform] ) { $scope.categories.push(cat); } break;
                        case 'apiso':
                            for ( var cat in data.data['apiServices'] ) {
                                $scope.categories.push(cat);
                                for ( var i = 0; i < data.data['apiServices'][cat].length; i++ ) {
                                    for ( var j = 0; j < data.data['apiServices'][cat][i]['services'].length; j++ ) {
                                        $scope.appAllRoutes.push( data.data['apiServices'][cat][i]['services'][j] );
                                    }
                                }
                            }
                            break;
                    }
                    $scope.toCopy.categoryTarget = $scope.categories[0];
                });
            }

            $scope.chooseCategories( $scope.targetComponent.application );

            if ( $scope.targetComponent.type === 'apiso' ) {
                $scope.validPrefix = false;
                $scope.prefix = {
                    "value": $scope.targetComponent.name
                };
            }

            $scope.copyComponent = function() {
                var nameExp = /([\\/\-+(){}[\]=<>*~`?\! '\"',.;:$@#])/ig,
                    nameRes = nameExp.exec( $scope.toCopy.name);

                if ( $scope.targetComponent.type === 'apiso' ) {
                    var prefixRes = nameExp.exec( $scope.prefix.value );

                    if ( !prefixRes && $scope.prefix.value !=='' ) {
                        var prefixMatch = 0;
                        for ( var i=0; i < $scope.appAllRoutes.length; i++ ){
                            if ( $scope.appAllRoutes[i].indexOf($scope.prefix.value + '/') === 0 ) {
                                ++prefixMatch;
                            }
                        }
                        prefixMatch === 0 ? $scope.validPrefix = true : $scope.validPrefix = false;
                    }
                }

                if ( $scope.validPrefix && !nameRes && !prefixRes && $scope.toCopy.name !== '' ) {
                    switch ( $scope.targetComponent.type ) {
                        case 'page': $scope.toCopy.type = 'screen'; break;
                        case 'view': $scope.toCopy.type = 'widget'; break;
                        case 'apiso':
                            $scope.toCopy.type = 'dataquery';
                            $scope.toCopy.prefix = $scope.prefix.value;
                            break;
                    }

                    dfxApplications.copyObject( $scope, $scope.toCopy ).then(function( data ) {
                        if ( data.data.data.type === 'error' ) {
                            dfxMessaging.showWarning( data.data.data.message );
                        } else {
                            switch ( $scope.targetComponent.type ) {
                                case 'page': dfxMessaging.showMessage( 'Page ' + $scope.toCopy.name + ' has been copyied successfully' ); break;
                                case 'view': dfxMessaging.showMessage( 'View ' + $scope.toCopy.name + ' has been copyied successfully' ); break;
                                case 'apiso': dfxMessaging.showMessage( 'API Service Object ' + $scope.toCopy.name + ' has been copyied successfully' ); break;
                            }
                            $scope.getAll();
                            if (callback != null) {
                                callback();
                            }
                            $mdDialog.hide();
                        }
                    });
                } else {
                    switch ( $scope.targetComponent.type ) {
                        case 'page': dfxMessaging.showWarning( 'Not valid Page Name' ); break;
                        case 'view': dfxMessaging.showWarning( 'Not valid View Name' ); break;
                        case 'apiso':
                            if ( nameRes ) {
                                dfxMessaging.showWarning( 'Not valid API Service Object Name' );
                                break;
                            } else if ( prefixRes || $scope.prefix.value === '' ) {
                                dfxMessaging.showWarning( 'Not valid API Route Prefix' );
                                break;
                            } else {
                                dfxMessaging.showWarning( 'API Route Prefix "' + $scope.prefix.value + '" already exists' );
                                break;
                            }
                    }
                }
            }

            $scope.closeDialog = function() {
                $mdDialog.hide();
            }
        }
    }

    $scope.moveToBtn = function($event) {
        var parentEl = angular.element(document.body);

        $mdDialog.show({
            parent: parentEl,
            targetEvent: $event,
            clickOutsideToClose: true,
            scope: $scope.$new(),
            templateUrl: 'studioviews/move_component_dialog.html',
            controller: DialogController
        });

        function DialogController($scope, $mdDialog) {
            $scope.categories = [];
            $scope.toMove = {};

            switch ( $scope.targetComponent.type ) {
                case 'page':
                    dfxPages.getOne( $scope, $scope.targetComponent.application, $scope.targetComponent.name, $scope.targetComponent.platform ).then(function( data ) {
                        $scope.toMove = data;
                    });
                    dfxPages.getCategories( $scope, $scope.targetComponent.application, $scope.targetComponent.platform ).then(function( data ) {
                        for ( var i = 0; i < data.data[$scope.targetComponent.platform].length; i++ ){
                            $scope.categories.push( data.data[$scope.targetComponent.platform][i].name );
                        }
                    });
                    break;
                case 'view':
                    dfxViews.getOne( $scope, $scope.targetComponent.application, $scope.targetComponent.name, $scope.targetComponent.platform ).then(function( data ) {
                        $scope.toMove = data;
                    });
                    dfxViews.getCategories( $scope, $scope.targetComponent.application, $scope.targetComponent.platform ).then(function( data ) {
                        for ( var i = 0; i < data.data[$scope.targetComponent.platform].length; i++ ){
                            $scope.categories.push( data.data[$scope.targetComponent.platform][i].name );
                        }
                    });
                    break;
                case 'apiso':
                    dfxApiServiceObjects.getOne( $scope, $scope.targetComponent.application, $scope.targetComponent.name ).then(function( data ) {
                        $scope.toMove = data.data.query;
                    });
                    dfxApiServiceObjects.getCategories( $scope, $scope.targetComponent.application ).then(function( data ) {
                        for ( var i = 0; i < data.data.querycats.length; i++ ){
                            $scope.categories.push( data.data.querycats[i].name );
                        }
                    });
                    break;
            }

            $scope.toMove.category = $scope.categories[0];

            $scope.moveComponent = function() {
                switch ( $scope.targetComponent.type ) {
                    case 'page':
                        dfxPages.update( $scope, $scope.toMove ).then(function( data ) {
                            data.result === 'success' ? dfxMessaging.showMessage('Page has been successfully moved') : dfxMessaging.showWarning('There was an error during moving Page');
                            $scope.getAll();
                            $mdDialog.hide();
                            if ( $location.path() === '/page/update/' + $scope.targetComponent.application + '/' + $scope.targetComponent.name ) {
                                $route.reload();
                            }
                        });
                        break;
                    case 'view':
                        dfxViews.update( $scope, $scope.toMove ).then(function( data ) {
                            data.result === 'success' ? dfxMessaging.showMessage('View has been successfully moved') : dfxMessaging.showWarning('There was an error during moving View');
                            $scope.getAll();
                            $mdDialog.hide();
                            if ( $location.path() === '/view/update/' + $scope.targetComponent.application + '/' + $scope.targetComponent.name ) {
                                $route.reload();
                            }
                        });
                        break;
                    case 'apiso':
                        delete $scope.toMove._id;
                        var movedRoutes = [];
                        for ( var key in $scope.toMove.apiRoutes ) {
                            var movedRoute = {};
                            movedRoute.data = $scope.toMove.apiRoutes[key];
                            movedRoute.name = key;
                            movedRoutes.push( movedRoute );
                        }
                        $scope.toMove.apiRoutes = movedRoutes ;
                        dfxApiServiceObjects.updateSo( $scope, $scope.toMove ).then(function( data ) {
                            data.data.result === 'success' ? dfxMessaging.showMessage('API Service Object has been successfully moved') : dfxMessaging.showWarning('There was an error during moving API Service Object');
                            $scope.getAll();
                            $mdDialog.hide();
                            if ( $location.path() === '/api_so/update/' + $scope.targetComponent.application + '/' + $scope.targetComponent.name ) {
                                $route.reload();
                            }
                        });
                        break;
                }
            }

            $scope.closeDialog = function() {
                $mdDialog.hide();
            }
        }
    }

    $scope.copyCatBtn = function($event) {
        var parentEl = angular.element(document.body);

        $mdDialog.show({
            parent: parentEl,
            targetEvent: $event,
            clickOutsideToClose: true,
            scope: $scope.$new(),
            templateUrl: 'studioviews/copy_category_dialog.html',
            controller: DialogController
        });

        function DialogController($scope, $mdDialog) {
            $scope.categoryObject = {
                "applicationName":   $scope.cat_app,
                "applicationTarget": $scope.cat_app,
                "categoryName":      $scope.cat_name,
                "categoryTarget":    $scope.cat_name,
                "type":              ""
            }
            $scope.copyType = '';
            $scope.validPrefix = true;

            switch ( $scope.cat_type ) {
                case 'page': $scope.categoryObject.type = 'screen'; $scope.categoryObject.platform = $scope.cat_platform; $scope.categoryObject.ownerId = ''; $scope.copyType = 'pages'; break;
                case 'view': $scope.categoryObject.type = 'widget'; $scope.categoryObject.platform = $scope.cat_platform; $scope.categoryObject.ownerId = ''; $scope.copyType = 'views'; break;
                case 'apiso':
                    $scope.categoryObject.type = 'dataquery';
                    $scope.categoryObject.prefix = $scope.cat_name;
                    $scope.copyType = 'API Service Objects';
                    $scope.validPrefix = false;
                    break;
            }

            $scope.chooseApp = function( appName ) {
                $scope.categories = [];
                $scope.appAllRoutes = [];
                dfxApplications.getAppTree( $scope, appName ).then(function( data ) {
                    switch ( $scope.cat_type ) {
                        case 'page': for ( var cat in data.data['pages'] ) { $scope.categories.push(cat); } break;
                        case 'view': for ( var cat in data.data['views'] ) { $scope.categories.push(cat); } break;
                        case 'apiso':
                            //var hasServices = 0;
                            //$scope.showPrefix = false;
                            //
                            //if ( data.data.apiServices[$scope.cat_name].length > 0 ) {
                            //    for ( var i = 0; i < data.data.apiServices[$scope.cat_name].length; i++ ) {
                            //        if ( data.data.apiServices[$scope.cat_name][i].services.length > 0 ) {
                            //            ++hasServices;
                            //        }
                            //    }
                            //}
                            //
                            //if ( hasServices > 0 ) {
                            //    $scope.showPrefix = true;
                            //    $scope.validPrefix = false;
                            //} else {
                            //    $scope.validPrefix = true;
                            //}

                            for ( var cat in data.data['apiServices'] ) {
                                $scope.categories.push(cat);
                                for ( var i = 0; i < data.data['apiServices'][cat].length; i++ ) {
                                    for ( var j = 0; j < data.data['apiServices'][cat][i]['services'].length; j++ ) {
                                        $scope.appAllRoutes.push( data.data['apiServices'][cat][i]['services'][j] );
                                    }
                                }
                            }
                            break;
                    }
                });
            }

            $scope.chooseApp( $scope.cat_app );

            $scope.copyCat = function() {
                var nameExp = /([\\/\-+(){}[\]=<>*~`?\! '\"',.;:$@#])/ig,
                    nameRes = nameExp.exec( $scope.categoryObject.categoryTarget );

                if ( $scope.cat_type === 'apiso' ) {
                    var prefixRes = nameExp.exec( $scope.categoryObject.prefix );

                    if ( !prefixRes && $scope.categoryObject.prefix !=='' ) {
                        var prefixMatch = 0;
                        for ( var i=0; i < $scope.appAllRoutes.length; i++ ){
                            if ( $scope.appAllRoutes[i].indexOf($scope.categoryObject.prefix + '/') === 0 ) {
                                ++prefixMatch;
                            }
                        }
                        prefixMatch === 0 ? $scope.validPrefix = true : $scope.validPrefix = false;
                    }
                }

                if ( $scope.validPrefix && !nameRes && !prefixRes && $scope.categoryObject.categoryTarget !== '' ) {
                    dfxApplications.copyCategory( $scope, $scope.categoryObject ).then(function( data ) {
                        dfxMessaging.showMessage( 'Category ' + $scope.categoryObject.categoryTarget + ' has been copyied successfully' );
                        $scope.getAll();
                        $mdDialog.hide();
                    }, function( data ) {
                        var errorData = data.data.error.message;
                        if ( errorData.indexOf('category') === -1 ) {
                            dfxMessaging.showMessage( 'Category ' + $scope.categoryObject.categoryTarget + ' has been copyied successfully but without existing ' + $scope.copyType + '.' );
                            $scope.getAll();
                            $mdDialog.hide();
                        } else {
                            dfxMessaging.showWarning( errorData );
                        }
                    });
                } else if ( $scope.cat_type !== 'apiso' || nameRes ) {
                    dfxMessaging.showWarning('Not valid Category Name');
                } else if ( prefixRes || $scope.categoryObject.prefix === '' ) {
                    dfxMessaging.showWarning( 'Not valid API Route Prefix' );
                } else {
                    dfxMessaging.showWarning( 'API Route Prefix "' + $scope.categoryObject.prefix + '" already exists' );
                }
            }

            $scope.closeDialog = function() {
                $mdDialog.hide();
            }
        }
    }
}]);

dfxStudioApp.controller("dfx_studio_search_controller", [ '$scope', '$routeParams', '$location', 'dfxApplications', function($scope, $routeParams, $location, dfxApplications) {
    var bodyHeight = parseFloat($("body").css('height')),
        searchResults = document.getElementById('search-results');
    $(searchResults).css('height', bodyHeight-110);

    $scope.runSearch = function() {
        if ( $routeParams.searchquery ) {
            dfxApplications.findAll( $routeParams.searchquery ).then( function( data ) {
                $scope.pagesArray = [];
                $scope.viewsArray = [];
                $scope.apiSoArray = [];
                if ( data.data.screens.length > 0 ) {
                    $scope.pagesArray = data.data.screens;
                }
                if ( data.data.widgets.length > 0 ) {
                    $scope.viewsArray = data.data.widgets;
                }
                if ( data.data.queries.length > 0 ) {
                    $scope.apiSoArray = data.data.queries;
                }
            });
        }
    }

    $scope.runSearch();

    $scope.editPage = function( app_name, page_platform, page_name ) {
        $location.path('/page/update/' + app_name + '/' + page_platform + '/' + page_name);
    }

    $scope.editView = function( app_name, view_platform, view_name ) {
        $location.path('/view/update/' + app_name + '/' + view_platform + '/' + view_name);
    }

    $scope.editApiSo = function( app_name, api_so_name ) {
        $location.path('/api_so/update/' + app_name + '/' + api_so_name);
    }
}]);

dfxStudioApp.controller("dfx_studio_category_controller", [ '$scope', '$routeParams', '$location', 'dfxApplications', function($scope, $routeParams, $location, dfxApplications) {
    if ( $location.$$path.indexOf('pages') === 10 ) {
        $scope.entity = 'pages';
    } else if ( $location.$$path.indexOf('views') === 10 ) {
        $scope.entity = 'views';
    } else if ( $location.$$path.indexOf('api_so') === 10  ) {
        $scope.entity = 'apiServices';
    }

    $scope.app_name = $routeParams.appname;
    if ( $routeParams.platform ) {
        $scope.cat_platform = $routeParams.platform;
    }
    $scope.category = $routeParams.categoryname ? $routeParams.categoryname : 'Default';
    $scope.table_data = [];

    dfxApplications.getAppTree( $scope, $scope.app_name ).then(function( data ) {
        if ( $scope.entity === 'apiServices' ) {
            for ( var cat in data.data['apiServices'] ) {
                if ( cat === $scope.category ) {
                    $scope.table_data = data.data['apiServices'][cat];
                }
            }
        } else if ( $scope.entity === 'pages' || $scope.entity === 'views' ) {
            $scope.table_data = data.data[$scope.entity][$scope.cat_platform][$scope.category];
        }
    });
    
    $scope.edit = function( name ) {
        switch ( $scope.entity ) {
            case 'pages':       $location.path('/page/update/' + $scope.app_name + '/' + $scope.cat_platform + '/'+ name); break;
            case 'views':       $location.path('/view/update/' + $scope.app_name + '/' + $scope.cat_platform + '/' + name); break;
            case 'apiServices': $location.path('/api_so/update/' + $scope.app_name + '/' + name); break;
        }
    };

    $scope.addEntity = function( name, platform ) {
        switch ( $scope.entity ) {
            case 'pages':       $location.path('/page/create/' + $scope.app_name + '/' + platform + '/' + name); break;
            case 'views':       $location.path('/view/create/' + $scope.app_name + '/' + platform + '/' + name); break;
            case 'apiServices': $location.path('/api_so/create/' + $scope.app_name + '/' + name); break;
        }
    };
}]);

dfxStudioApp.controller("dfx_studio_platform_controller", [ '$scope', '$mdSidenav', 'dfxMessaging', '$mdDialog', '$timeout', function($scope, $mdSidenav, dfxMessaging, $mdDialog, $timeout) {
    $scope.developers = {};
    $scope.cloud = {};
    $scope.$watch('$parent.platform_section', function(newVal){
        var platform_tabs = ['developers','cloud','settings'];
        if(platform_tabs.indexOf(newVal) !== -1){
            $scope.section = newVal;
            $timeout(function(){
                $scope.platformTabs = $('#dfx-studio-main-content > div > md-tabs > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper').children();
                $($scope.platformTabs[platform_tabs.indexOf(newVal)]).trigger('click');
            },0);
        }
    });

    $scope.defineSection = function(section){
        for(var i= 0; i < 2; i++){
            if($scope.platformTabs && $($scope.platformTabs[i]).hasClass('md-active')){
                $scope.section = section;
            }
        }
    };
}]);

dfxStudioApp.controller("dfx_studio_cloud_controller", [ '$scope', 'dfxPlatformBluemix', 'dfxPhoneGapProperties', '$mdSidenav', 'dfxMessaging', '$mdDialog', '$timeout', 'dfxDeployment', 'dfxApplications', function($scope, dfxPlatformBluemix, dfxPhoneGapProperties, $mdSidenav, dfxMessaging, $mdDialog, $timeout, dfxDeployment, dfxApplications) {
    var parentScope = $scope.$parent;
    parentScope.cloud = $scope;
    $scope.bluemix = {};
    $scope.bluemix.credentials = {
        email:                  "",
        password:               "",
        selected_organization:  "",
        selected_space:         ""
    };

    // PhoneGap
    var tenantId = $scope.$parent.$parent.tenant_id;
    dfxPhoneGapProperties.getData(tenantId).then(function(tenant){
        $scope.phoneGapLogin = tenant.phoneGapLogin;
        $scope.phoneGapPassword = tenant.phoneGapPassword;
    });
    $scope.savePhoneGapData = function() {
        var data = {"phoneGapLogin" : $('#phoneGapLogin').val(), "phoneGapPassword" : $('#phoneGapPassword').val()};
        dfxPhoneGapProperties.saveData(tenantId, data).then(function(){
            dfxMessaging.showMessage('PhoneGap properties has been successfully updated.');
        });
    }

    GLOBAL_SOCKET.on('tenant_'+ $scope.tenant_id +'_bmImageBuild', function(data){
        if (data.result === 'success')  {
            $scope.$apply(function(){
                $scope.bluemix.images.map(function(image){
                    if ((image.clearImageName === data.clearImageName) && (image.version == data.version)){
                        image.created = (new Date).toISOString();
                        delete image.started;
                    }
                });
            })
        }
    });

    $scope.bluemix.toggleImageApps = function(index){
        if($scope.bluemix.images[index].show_apps){
            $scope.bluemix.images[index].show_apps = false ;
            $scope.bluemix.images_counter = $scope.bluemix.images_counter -1;
        }else{
            $scope.bluemix.images[index].show_apps = true ;
            $scope.bluemix.images_counter = $scope.bluemix.images_counter +1;
        }
    };

    $scope.bluemix.closeSidenav = function(){
        var sideNavInstance = $mdSidenav('side_nav_left');
        sideNavInstance.toggle();
    };

    $scope.getAppsBuilds = function(){
        dfxPlatformBluemix.getAppsBuilds().then(function(data){
            var apps = data.data;
            for(var i = 0; i < apps.length; i++){
                for(key in apps[i]){
                    $scope.bluemix.new_image.applications.push({
                        application_name: key,
                        builds: apps[i][key],
                        display_builds: false
                    });
                }
            }
            $scope.bluemix.builds_counter = 0;
        });
    };

    $scope.bluemix.saveImage = function(){
        $scope.bluemix.disabled_button = true ;
        $scope.bluemix.show_sidenav_content = false;
        var alert = '';
        if ($.isEmptyObject($scope.bluemix.new_image.name)) {
            alert = "Image name cannot be empty";
        }else if (!/^[-a-zA-Z0-9]+$/.test($scope.bluemix.new_image.name)) {
            alert = "Image name can have only letters, numbers or dash symbols";
        }else if($.isEmptyObject($scope.bluemix.new_image.version)){
            alert = "Image version cannot be empty";
        }else if (!/^[-a-zA-Z0-9]+$/.test($scope.bluemix.new_image.version)) {
            alert = "Image version can have only letters, numbers or dash symbols";
        }
        if(alert!==''){
            $scope.bluemix.disabled_button = false ;
            $scope.bluemix.show_sidenav_content = true;
            dfxMessaging.showWarning(alert) ;
            return;
        }
        var is_unique = true;
        for(var z = 0; z < $scope.bluemix.images.length; z++){
            if(($scope.bluemix.images[z].clearImageName + $scope.bluemix.images[z].version) === ($scope.bluemix.new_image.name + $scope.bluemix.new_image.version)){
                is_unique = false;
            }
        }
        if(is_unique){
            var result = [];
            var content = [];
            for(var i= 0; i < $scope.bluemix.new_image.applications.length; i++){
                for(var j= 0; j < $scope.bluemix.new_image.applications[i].builds.length; j++){
                    if($scope.bluemix.new_image.applications[i].builds[j].selected){
                        $scope.bluemix.new_image.applications[i].selected = true;
                        result.push({name: $scope.bluemix.new_image.applications[i].application_name,
                            build: ($scope.bluemix.new_image.applications[i].builds[j].app_version + '.' +  $scope.bluemix.new_image.applications[i].builds[j].build_number),
                            platform : $scope.bluemix.new_image.applications[i].builds[j].platform});
                    }
                }
            }

            for(var q= 0; q < $scope.bluemix.new_image.applications.length; q++){
                if($scope.bluemix.new_image.applications[q].selected){
                    content.push({
                        name: $scope.bluemix.new_image.applications[q].application_name,
                        builds: [],
                        display_builds: false
                    })
                    for(var t =0; t < $scope.bluemix.new_image.applications[q].builds.length; t++){
                        if($scope.bluemix.new_image.applications[q].builds[t].selected){
                            content[content.length - 1].builds.push($scope.bluemix.new_image.applications[q].builds[t].app_version + '.' + $scope.bluemix.new_image.applications[q].builds[t].build_number);
                        }
                    }
                }
            }
            $scope.bluemix.builds_counter = 0;

            dfxPlatformBluemix.saveImage($scope.bluemix.new_image.name, $scope.bluemix.new_image.version, result).then(function(){
                $scope.bluemix.disabled_button = false ;
                $scope.bluemix.show_sidenav_content = true;
                dfxMessaging.showMessage('Started creating Bluemix Image!');
                $scope.bluemix.images.push({
                    clearImageName:     $scope.bluemix.new_image.name,
                    version:            $scope.bluemix.new_image.version,
                    content:            content
                })
                var sideNavInstance = $mdSidenav('side_nav_left');
                sideNavInstance.toggle();
            }, function(){
                $scope.bluemix.disabled_button = false ;
                $scope.bluemix.show_sidenav_content = true;
            });
        }else{
            dfxMessaging.showWarning('Can\'t save. Image with such name and version is already exist!');
            $scope.bluemix.disabled_button = false ;
            $scope.bluemix.show_sidenav_content = true;
        }
    };

    $scope.bluemix.confirmImageDelete = function(ev, image, index) {
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want to delete this image?')
            .textContent('Image will be removed from Bluemix.')
            .ariaLabel('remove image')
            .targetEvent(ev)
            .cancel('Cancel')
            .ok('OK');
        $mdDialog.show(confirm).then(function() {
            $scope.bluemix.deleteImage(image, index);
        }, function() {
        });
    };

    $scope.bluemix.deleteImage = function(image, index){
        dfxPlatformBluemix.deleteImage(image.clearImageName, image.version).then(function(){
            $scope.bluemix.images.splice(index, 1);
            dfxMessaging.showMessage('Image data has been successfully deleted.');
        }, function(){
            dfxMessaging.showWarning('Can\'t delete.');
        });
    };

    $scope.bluemix.runImage = function(image){
        /*dfxPlatformBluemix.runImage().then(function(){

         });*/
    };

    $scope.bluemix.toggleNewImageBuilds = function(index, val){
        if($scope.bluemix.new_image.applications[index].display_builds){
            $scope.bluemix.new_image.applications[index].display_builds = false;
            $scope.bluemix.builds_counter = $scope.bluemix.builds_counter - 1;
        }else{
            $scope.bluemix.new_image.applications[index].display_builds = true;
            $scope.bluemix.builds_counter = $scope.bluemix.builds_counter + 1;
        }
    };

    $scope.initBluemixImage = function(){
        $scope.bluemix.show_sidenav_content = true;
        $scope.bluemix.new_image = {
            applications :      [],
            name:               "",
            version:            ""
        };
        $scope.getAppsBuilds();
        var sideNavInstance = $mdSidenav('side_nav_left');
        sideNavInstance.toggle();
    };

    dfxPlatformBluemix.getUser().then(function(res){
        var user = res.data.data ;
        if(user.email){
            $scope.bluemix.credentials.email = user.email ;
            $scope.bluemix.logged_in = true;
            $scope.bluemix.authenticated = false;
            $scope.bluemix.organizations_list = user.organizations ;
            $scope.bluemix.credentials.selected_organization = user.choosenOrg ;
            $scope.bluemix.space_list = user.spaces ;
            $scope.bluemix.credentials.selected_space = user.choosenSpace ;
            $scope.bluemix.space_spinner = true ;
                dfxPlatformBluemix.loginCF().then(function(){
                    dfxPlatformBluemix.remoteImagesList().then(function(images){
                        $scope.bluemix.images = images ;
                        for(var x = 0; x < $scope.bluemix.images.length; x++){
                            $scope.bluemix.images[x].show_apps = false ;
                        }
                        $scope.bluemix.images_counter = 0;
                        $scope.bluemix.space_spinner = false ;
                        $scope.bluemix.authenticated = true ;
                    });
                });
        }else{
            $scope.bluemix.logged_in = false;
            $scope.bluemix.authenticated = false ;
        }

    }, function(){

    });

    /*
    var data = {
        email : "vova@interactive-clouds.com",
        pass  : "anSp5G5zzy9guIkP1sKPy6Sd"
    };
   */

    $scope.bluemix.logout = function(){
        dfxPlatformBluemix.bluemixLogout().then(function(res){
            $scope.bluemix.credentials = {}
            $scope.bluemix.organizations_list = "" ;
            $scope.bluemix.space_list = "" ;
            $scope.bluemix.authenticated = false ;
            $scope.bluemix.logged_in = false ;
        });
    };

    $scope.bluemix.getOrgsList = function(){
        dfxPlatformBluemix.getOrgsList().then(function(res){
            $scope.bluemix.organizations_list = res.data.data;
            if(Object.keys($scope.bluemix.organizations_list).length === 1){
                $scope.bluemix.credentials.selected_organization = Object.keys($scope.bluemix.organizations_list)[0];
                $scope.bluemix.setChoosenOrg($scope.bluemix.credentials.selected_organization);
            }
        }, function(){
            $scope.bluemix.organization_spinner = false ;
        });
    };

    $scope.bluemix.setChoosenOrg = function(guid){
        $scope.bluemix.organization_spinner = true ;
        dfxPlatformBluemix.setChoosenOrg(guid).then(function(){
            $scope.bluemix.getSpacesList() ;
        }, function(){
            $scope.bluemix.organization_spinner = false ;
        });
    };

    $scope.bluemix.getSpacesList = function(){
        dfxPlatformBluemix.getSpacesList().then(function(res){
            $scope.bluemix.organization_spinner = false ;
            $scope.bluemix.space_list = res.data.data ;
            if(Object.keys($scope.bluemix.space_list).length === 1){
                $scope.bluemix.credentials.selected_space = Object.keys($scope.bluemix.space_list)[0];
                $scope.bluemix.setChoosenSpace($scope.bluemix.credentials.selected_space);
            }
        });
    };

    $scope.bluemix.setChoosenSpace = function(guid){
        $scope.bluemix.space_spinner = true ;
        dfxPlatformBluemix.setChoosenSpace(guid).then(function(){
            dfxPlatformBluemix.loginCF().then(function(){
                dfxPlatformBluemix.remoteImagesList().then(function(images){
                    $scope.bluemix.images = images ;
                    for(var x = 0; x < $scope.bluemix.images.length; x++){
                        $scope.bluemix.images[x].show_apps = false ;
                    }
                    $scope.bluemix.images_counter = 0;
                    $scope.bluemix.space_spinner = false ;
                    $scope.bluemix.authenticated = true ;
                });
            });
        });
    };

    $scope.bluemix.loginDialog = function() {
        $mdDialog.show({
            scope: $scope.$new(),
            controller: DialogController,
            templateUrl: 'studioviews/bluemix_login_dialog.html',
            parent: angular.element(document.body),
            clickOutsideToClose:true
        }).then(function() {

        }, function() {
            // if cancel
        });

        function DialogController($scope, $mdDialog) {
            $scope.bluemix.login = function(){
                $scope.bluemix.email_pass_spinner = true;
                var data = {
                    email : $scope.bluemix.credentials.email,
                    pass  : $scope.bluemix.credentials.password
                };
                dfxPlatformBluemix.bluemixLogin(data).then(function(res){
                    $scope.bluemix.logged_in = true ;
                    $scope.bluemix.email_pass_spinner = false;
                    dfxMessaging.showMessage('You have logged in successfully.Choose organization and space in order to finish authentication.') ;
                    $scope.bluemix.getOrgsList();
                }, function(){
                    $scope.bluemix.logged_in = false ;
                    $scope.bluemix.email_pass_spinner = false;
                    dfxMessaging.showWarning('The email address or password you entered is not valid.') ;
                });
            };
            $scope.bluemix.hide = function() {
                $mdDialog.hide();
            };
            $scope.bluemix.cancel = function() {
                $mdDialog.cancel();
            };
        }
    };
}]);

dfxStudioApp.controller("dfx_studio_platform_settings_controller", [ '$scope', 'dfxGoogleMapProperties','dfxMessaging', function($scope, dfxGoogleMapProperties, dfxMessaging) {
    var tenantId = $scope.$parent.$parent.tenant_id;
    dfxGoogleMapProperties.getAPIKey(tenantId).then(function(tenant){
        $scope.googleAPIKey = tenant.googleAPIKey;
    });
    $scope.saveGoogleKey = function() {
        dfxGoogleMapProperties.putAPIKey(tenantId, $('#googleAPIKey').val()).then(function(){
            dfxMessaging.showMessage('Google API key has been successfully updated.');
        });
    }
}]);

dfxStudioApp.controller("dfx_studio_developers_controller", [ '$scope', 'dfxPlatformDevelopers', '$mdSidenav', 'dfxMessaging', '$mdDialog', function($scope, dfxPlatformDevelopers, $mdSidenav, dfxMessaging, $mdDialog) {
    var parentScope = $scope.$parent;
    parentScope.developers = $scope;
    $scope.users = [];
    $scope.current_user = {};
    $scope.new_user = {};
    $scope.isSidenavOpen = false;

    $scope.initNewUser = function(){
        $scope.operation = 'create';
        $scope.new_user.login = "";
        $scope.new_user.firstName = "";
        $scope.new_user.lastName = "";
        $scope.new_user.email = "";
        $scope.new_user.pass = "";
        $scope.new_user.repeat_pass = "";
        $scope.new_user.pass_matching = false;
        $scope.new_user.roles = {};
        $scope.new_user.roles.default = 'admin';
        $scope.new_user.roles.list = [];
        $scope.new_user.admin_role = true;
        $scope.new_user.dev_role = false;
        $scope.new_user.show_pass_message = false;

        var sideNavInstance = $mdSidenav('side_nav_left');
        sideNavInstance.toggle();
    };

    $scope.getUsers = function(){
        dfxPlatformDevelopers.getUsers($scope.app_name).then(function(data){
            $scope.users = data;
        });
    };

    $scope.getUsers();

    $scope.editCurrentUser = function(user){
        $scope.operation = 'update';
        $scope.current_user = user;
        $scope.current_user.pass_changed = false;
        $scope.current_user.new_pass = "newpass";
        $scope.current_user.repeat_pass = "";
        $scope.current_user.pass_matching = false;
        $scope.current_user.show_pass_message = false;

        if(user.roles.list.indexOf('admin') !== -1){
            $scope.current_user.admin_role = true;
        }else{
            $scope.current_user.admin_role = false;
        }

        if(user.roles.list.indexOf('developer') !== -1){
            $scope.current_user.dev_role = true;
        }else{
            $scope.current_user.dev_role = false;
        }
        var sideNavInstance = $mdSidenav('side_nav_left');
        sideNavInstance.toggle();
    };

    $scope.closeSidenav = function(){
        var sideNavInstance = $mdSidenav('side_nav_left');
        sideNavInstance.toggle();
    };

    $scope.changePass = function(){
        $scope.current_user.pass_changed = true;
    };

    $scope.showPassMessage = function(user){
        user.show_pass_message = true;
    };

    $scope.updateUser = function(){
        var roles_list = [];
        if($scope.current_user.admin_role){
            roles_list.push('admin');
        }
        if($scope.current_user.dev_role){
            roles_list.push('developer');
        }
        if(roles_list.length !==0){
            $scope.current_user.roles.list = roles_list;
        }
        dfxPlatformDevelopers.updateUser($scope.current_user, $scope.current_user.new_pass, $scope.current_user.pass_changed).then(function(){
            var sideNavInstance = $mdSidenav('side_nav_left');
            sideNavInstance.toggle();
            dfxMessaging.showMessage('Developer data has been successfully updated.');
        }, function(){
            dfxMessaging.showWarning('Can\'t update developer data.');
        });
    };

    $scope.createUser = function(){
        var alert = '';
        if ($scope.new_user.login.indexOf(" ") != -1) {
            alert = "Login cannot have empty spaces";
        }
        else if ($.isEmptyObject($scope.new_user.login)) {
            alert = "Login cannot be empty";
        }
        else if (!/^[a-zA-Z0-9-_.]+$/.test($scope.new_user.login)) {
            alert = "Login can have only letters, numbers, underscore or dash symbols";
        }
        if (alert) {
            dfxMessaging.showWarning(alert);
        } else {
            var is_unique = true;
            for(var i=0; i < $scope.users.length; i++){
                if($scope.users[i].login === $scope.new_user.login){
                    is_unique = false;
                    break;
                }
            }
            if(is_unique){
                var roles_list = [];
                if($scope.new_user.admin_role){
                    roles_list.push('admin');
                }
                if($scope.new_user.dev_role){
                    roles_list.push('developer');
                }
                if(roles_list.length !==0){
                    $scope.new_user.roles.list = roles_list;
                }
                dfxPlatformDevelopers.createUser($scope.new_user).then(function(){
                    var sideNavInstance = $mdSidenav('side_nav_left');
                    var added_user = $scope.new_user;
                    $scope.new_user = {};
                    $scope.users.push(added_user);
                    sideNavInstance.toggle();
                    dfxMessaging.showMessage('New developer has been successfully created.');
                }, function(res){
                    dfxMessaging.showWarning('Can\'t create new developer. ' + res.data.data);
                });
            }else{
                dfxMessaging.showWarning("Developer with such login is already exist!");
            }
        }
    };

    $scope.confirmUserDelete = function(ev, userlogin) {
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want to delete this developer?')
            .textContent('Developer will be removed from the repository.')
            .ariaLabel('remove user')
            .targetEvent(ev)
            .cancel('Cancel')
            .ok('OK');
        $mdDialog.show(confirm).then(function() {
            $scope.deleteUser(userlogin);
        }, function() {
        });
    };

    $scope.deleteUser = function(userlogin){
        dfxPlatformDevelopers.deleteUser(userlogin).then(function(){
            for(var i =0; i < $scope.users.length; i++){
                if($scope.users[i].login === userlogin){
                    $scope.users.splice(i, 1);
                    break;
                }
            }
            dfxMessaging.showMessage('Developer data has been successfully deleted.');
        });
    };

    $scope.$watch("current_user.repeat_pass", function(newValue){
        if(newValue){
            if(newValue===$scope.current_user.new_pass){
                $scope.current_user.pass_matching = true;
            }else{
                $scope.current_user.pass_matching = false;
            }
        }
    });

    $scope.$watch("new_user.repeat_pass", function(newValue){
        if(newValue){
            if(newValue===$scope.new_user.pass){
                $scope.new_user.pass_matching = true;
            }else{
                $scope.new_user.pass_matching = false;
            }
        }
    });

    $scope.$watch("current_user.roles.default", function(newValue){
        if(newValue){
            if(newValue === 'admin'){
                $scope.current_user.admin_role = true;
                $scope.current_user.admin_disabled = true;
            }else{
                $scope.current_user.admin_disabled = false;
            }
            if(newValue === 'developer'){
                $scope.current_user.dev_role = true;
                $scope.current_user.dev_disabled = true;
            }else{
                $scope.current_user.dev_disabled = false;
            }
        }
    });

    $scope.$watch("new_user.roles.default", function(newValue){
        if(newValue){
            if(newValue === 'admin'){
                $scope.new_user.admin_role = true;
                $scope.new_user.admin_disabled = true;
            }else{
                $scope.new_user.admin_disabled = false;
            }
            if(newValue === 'developer'){
                $scope.new_user.dev_role = true;
                $scope.new_user.dev_disabled = true;
            }else{
                $scope.new_user.dev_disabled = false;
            }
        }
    });

    $scope.$watch('isSidenavOpen', function(newValue){
        if(!newValue){
            $scope.getUsers();
        }
    });

}]);


dfxStudioApp.controller("dfx_studio_home_controller", [ '$scope', 'dfxStats', '$timeout', '$compile', '$window', '$route', '$routeParams', '$mdDialog', 'dfxApplications', 'dfxViews', 'dfxPages', 'dfxApiServiceObjects', 'dfxMessaging', '$location', function($scope, dfxStats, $timeout, $compile, $window, $route, $routeParams, $mdDialog, dfxApplications, dfxViews, dfxPages, dfxApiServiceObjects, dfxMessaging, $location) {
    $scope.display_activity_panel = false;
    $scope.platform_stats = {};
    $scope.chart_pages_data = [];
    $scope.chart_pages_option = {
        chart: {
            type: 'discreteBarChart',
            margin : {
                top: 20,
                right: 20,
                bottom: 50,
                left: 55
            },
            x: function(d){return d.label;},
            y: function(d){return d.value;},
            showValues:  true,
            valueFormat: function (d) {
                return d3.format(',.')(d);
            },
            duration:    500,
            xAxis:       {
                axisLabel: 'Components',
                axisLabelDistance: -5
            },
            yAxis:       {
                axisLabel: 'Count',
                axisLabelDistance: -5,
                tickFormat: function (d) {
                    return d3.format(',.')(d);
                }
            }
        },
        title: {
            text: 'App Statistics',
            enable: true
        }
    };

    dfxStats.getMain( $scope ).then( function(data) {
        if (data.apps != null) {
            for (var i=0; i<data.apps.length; i++) {
                data.apps[i].chartData = [
                    {
                        key: "Cumulative Components",
                        values: [
                            {
                                "label" : "Pages" ,
                                "value" : data.apps[i].pages.count
                            },
                            {
                                "label" : "Views" ,
                                "value" : data.apps[i].views.count
                            },
                            {
                                "label" : "API" ,
                                "value" : data.apps[i].apiServices.count
                            }
                        ]}
                ];
            }
        }
        $scope.platform_stats = data;
    });

    $scope.loadActivity = function(app_name, channel) {
        $scope.display_activity_panel = true;
    };

    $scope.navigateToApp = function(appname){
        if(appname!=='Shared Catalog'){
            $scope.loadStudioView(appname + '/configuration/general') ;
        }
    };

    $scope.entity = $routeParams.entity === 'api_so' ? 'apiServices' : $routeParams.entity;
    $scope.appname = $routeParams.appname ;

    if($scope.appname){
        $timeout(function(){
            dfxApplications.getAppTree( $scope, $scope.appname ).then(function( data ) {
                var entityData = data.data[$scope.entity];
                $scope.table_data = [];
                if ( $scope.entity === 'pages' || $scope.entity === 'views' ) {
                    for ( var platform in entityData ) {
                        for ( var cat in entityData[platform] ) {
                            for ( var i=0; i < entityData[platform][cat].length; i++ ) {
                                var table_data_item = entityData[platform][cat][i];
                                table_data_item.category = cat;
                                table_data_item.platform = platform;
                                $scope.table_data.push(table_data_item);
                            }
                        }
                    }
                } else if ( $scope.entity === 'apiServices' ) {
                    for(var k in entityData){
                        for(var n=0; n < entityData[k].length; n++){
                            $scope.table_data.push({
                                category    :  k,
                                name        :  entityData[k][n].name,
                                description :  entityData[k][n].description
                            });
                        }
                    }
                }
            });
        },0);
    }

    $scope.navigateToPages = function(appname){
        $scope.appname = appname;
        if(appname !== 'Shared Catalog'){
            var arr = $scope.platform_stats.apps ;
            for(var j=0; j < arr.length; j++){
                if(arr[j].name === appname && arr[j]){
                    $scope.loadStudioView('/categories/pages/' + appname);
                    break;
                }
            }
        }
    };

    $scope.navigateToViews = function(appname){
        $scope.appname = appname;
        if(appname !== 'Shared Catalog'){
            var arr = $scope.platform_stats.apps ;
            for(var j=0; j < arr.length; j++){
                if(arr[j].name === appname && arr[j]){
                    $scope.loadStudioView('/categories/views/' + appname);
                    break;
                }
            }
        }
    };

    $scope.navigateToApis = function(appname){
        $scope.appname = appname;
        if(appname !== 'Shared Catalog'){
            var arr = $scope.platform_stats.apps ;
            for(var j=0; j < arr.length; j++){
                if(arr[j].name === appname && arr[j]){
                    $scope.loadStudioView('/categories/api_so/' + appname);
                    break;
                }
            }
        }
    };

    $scope.addEntity = function() {
        switch ( $scope.entity ) {
            case 'pages':       $location.path('/page/create/' + $scope.appname + '/web/Default'); break;
            case 'views':       $location.path('/view/create/' + $scope.appname + '/web/Default'); break;
            case 'apiServices': $location.path('/api_so/create/' + $scope.appname + '/Default'); break;
        }
    };

    $scope.edit = function( item ) {
        switch ( $scope.entity ) {
            case 'pages':       $location.path('/page/update/' + $scope.appname + '/' + item.platform + '/' + item.name); break;
            //case 'views':       $location.path('/view/update/' + $scope.appname + '/' + item.platform + '/' + item.name); break;
            case 'views':
                window.localStorage.removeItem('pagePreviewName');
                $window.open( '/studio/widget/' + item.platform + '/' + $scope.appname + '/' + item.name + '/index.html', '_blank' );
                break;
            case 'apiServices': $location.path('/api_so/update/' + $scope.appname + '/' + item.name); break;
        }
    };

    $scope.copyEntity = function( item ) {
        $scope.$parent.targetComponent = {
            "name":        item.name,
            "application": $scope.appname,
            "category":    item.category,
        }
        if ($scope.entity=='views') {
            $scope.$parent.targetComponent.type = 'view';
            $scope.$parent.targetComponent.platform = item.platform;
        } else if ($scope.entity=='pages') {
            $scope.$parent.targetComponent.type = 'page';
            $scope.$parent.targetComponent.platform = item.platform;
        } else {
            $scope.$parent.targetComponent.type = 'apiso';
        }
        $scope.copyToBtn(null, function() {
            $route.reload();
        });
    };

    $scope.infoEntity = function( item ) {
        $location.path('/view/update/' + $scope.appname + '/' + item.platform + '/' + item.name);
    };


    $scope.removeEntity = function( item, ev ) {
        $scope.$parent.targetComponent = {
            "name":        item.name,
            "application": $scope.appname,
            "category":    item.category,
        }
        if ($scope.entity=='views') {
            $scope.$parent.targetComponent.type = 'view';
            $scope.$parent.targetComponent.platform = item.platform;
        } else if ($scope.entity=='pages') {
            $scope.$parent.targetComponent.type = 'page';
            $scope.$parent.targetComponent.platform = item.platform;
        } else {
            $scope.$parent.targetComponent.type = 'apiso';
        }
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want delete this component?')
            .textContent('The component will be removed permanently from the repository.')
            .ariaLabel('delete component')
            .targetEvent(ev)
            .cancel('Cancel')
            .ok('OK');
        $mdDialog.show(confirm).then(function() {
            if ($scope.entity=='views') {
                dfxViews.delete( $scope, $scope.$parent.targetComponent ).then( function(data) {
                    dfxMessaging.showMessage( 'The view has been deleted' );
                    $scope.getAll();
                    $route.reload();
                });
            } else if ($scope.entity=='pages') {
                dfxPages.delete( $scope, $scope.$parent.targetComponent ).then( function(data) {
                    dfxMessaging.showMessage( 'The page has been deleted' );
                    $scope.getAll();
                    $route.reload();
                });
            } else {
                dfxApiServiceObjects.deleteSo( $scope, $scope.$parent.targetComponent ).then( function(data) {
                    dfxMessaging.showMessage( 'The API Service Object has been deleted' );
                    $scope.getAll();
                    $route.reload();
                });
            }
        }, function() {
        });
    };

    $timeout(function(){
        var arr = $scope.platform_stats.apps;
        if (arr!=null) {
            for(var i =0; i < arr.length; i++ ){

                var bar = $('#chart_' + arr[i].name.replace(' ', '_') + ' > nvd3 > svg > g > g > g.nv-barsWrap.nvd3-svg > g > g > g > g > g:nth-child(1) > rect').parent();
                var barHtml = bar.html();
                if(barHtml){
                    barHtml = barHtml.replace('class="discreteBar"', 'class="discreteBar" ng-click="navigateToPages(\'' + arr[i].name.replace(' ', '_') + '\')" style="cursor: pointer;"') ;
                    bar.html(barHtml);
                    $compile(bar.contents())($scope);
                }

                var bar = $('#chart_' + arr[i].name.replace(' ', '_') + ' > nvd3 > svg > g > g > g.nv-barsWrap.nvd3-svg > g > g > g > g > g:nth-child(2) > rect').parent();
                var barHtml = bar.html();
                if(barHtml){
                    barHtml = barHtml.replace('class="discreteBar"', 'class="discreteBar" ng-click="navigateToViews(\'' + arr[i].name.replace(' ', '_') + '\')" style="cursor: pointer;"') ;
                    bar.html(barHtml);
                    $compile(bar.contents())($scope);
                }

                var bar = $('#chart_' + arr[i].name.replace(' ', '_') + ' > nvd3 > svg > g > g > g.nv-barsWrap.nvd3-svg > g > g > g > g > g:nth-child(3) > rect').parent();
                var barHtml = bar.html();
                if(barHtml){
                    barHtml = barHtml.replace('class="discreteBar"', 'class="discreteBar" ng-click="navigateToApis(\'' + arr[i].name.replace(' ', '_') + '\')" style="cursor: pointer;"') ;
                    bar.html(barHtml);
                    $compile(bar.contents())($scope);
                }
            }
        }
    }, 1000);

    var bodyHeight = parseFloat($("body").css('height'));
    $("#home-page-apps").css('height', bodyHeight - 59);
}]);

dfxStudioApp.controller("dfx_studio_stackoverflow_controller", [ '$scope', '$window', function($scope, $window) {
    $scope.serch_parameters = ['dreamface'] ;
    $scope.serchOnStackoverflow = function(){
        var parameters = $scope.serch_parameters.join('+') ;
        var path = 'http://stackoverflow.com/search?q=' + parameters;
        $window.open(path, "_blank") ;
    };
}]);

dfxStudioApp.controller("dfx_studio_samples_controller", [ '$scope', '$http', '$window', '$mdDialog', 'dfxMessaging', 'dfxSamples', 'dfxApplications', 'dfxViews', function($scope, $http, $window, $mdDialog, dfxMessaging, dfxSamples, dfxApplications, dfxViews) {
    
    $scope.categories = [];
    $scope.samples = [];
    $scope.isCategoriesLoaded = false;
    $scope.isCategoryLoaded = false;
    $scope.isSampleLoaded = false;

    dfxSamples.contents( $scope, '' ).then( function(contents) {
        if (contents.data != null) {
            for (var i=0; i<contents.data.length; i++) {
                if (contents.data[i].type=='dir') {
                    $scope.loadCategory( contents.data[i].name, contents.data[i].path );
                }
            }
        }
        $scope.isCategoriesLoaded = true;
    });

    $scope.loadCategory = function(cat_name, cat_path) {
        $scope.isCategoryLoaded = false;
        dfxSamples.contents( $scope, cat_path ).then( function(contents) {
            for (var i=0; i<contents.data.length; i++) {
                if (contents.data[i].type=='dir') {
                    $scope.loadSample( contents.data[i].name, contents.data[i].path, cat_name );
                } else {
                    dfxSamples.contents( $scope, contents.data[i].path ).then( function(file_contents) {
                        $scope.loadFile( file_contents.data.url, $scope.categories, cat_name );
                    });
                }
            }
            $scope.isCategoryLoaded = true;
        });
    };

    $scope.loadSample = function(sample_name, sample_path, cat_name) {
        $scope.isSampleLoaded = false;
        dfxSamples.contents( $scope, sample_path ).then( function(contents) {
            for (var i=0; i<contents.data.length; i++) {
                if (contents.data[i].type=='file') {
                    dfxSamples.contents( $scope, contents.data[i].path ).then( function(file_contents) {
                       $scope.loadFile( file_contents.data.url, $scope.samples, sample_name, cat_name ); 
                    });
                }
            }
            $scope.isSampleLoaded = true;
        });
    };

    $scope.loadFile = function(file_url, collection, property, cat_name) {
        $http.get( file_url ).then( function(file_contents) {
            var new_item = {
                'name': property,
                'content': JSON.parse(atob(file_contents.data.content)),
                'category': cat_name
            };
            collection.push(new_item);
        });
    };

    $scope.readDocumentation = function(sample) {
        $window( sample.content.documentation, '_blank' );
    };

    $scope.openInstallSample = function(sample) {
        $scope.selected_sample = sample;
        dfxApplications.getAll( $scope ).then( function(apps) {
            $scope.applications = apps.data;
            $mdDialog.show({
                scope: $scope,
                controller: DialogController,
                templateUrl: 'studioviews/samples_install_dialog.html',
                parent: angular.element(document.body),
                clickOutsideToClose:true
            }).then(function() {

            }, function() {
                // if cancel

            });
        });
    };

    function DialogController($scope, $mdDialog) {
        $scope.install = function() {
            $mdDialog.hide();
            $scope.installSample();
        };
        $scope.hide = function() {
            $mdDialog.hide();
        };
        $scope.cancel = function() {
            $mdDialog.cancel();
        };
    }

    $scope.installSample = function() {
        // Install View
        dfxSamples.contents( $scope, $scope.selected_sample.category + '/' + $scope.selected_sample.name + '/view/source.json' ).then( function(view_source) {
            dfxSamples.contents( $scope, $scope.selected_sample.category + '/' + $scope.selected_sample.name + '/view/script.js' ).then( function(view_script) {
                dfxSamples.contents( $scope, $scope.selected_sample.category + '/' + $scope.selected_sample.name + '/view/styles.css' ).then( function(view_styles) {
                    var new_view = {
                        'name': $scope.selected_sample.name,
                        'description': $scope.selected_sample.content.title,
                        'category': 'Default',
                        'wtype': 'visual',
                        'application': $scope.selected_application,
                        'platform': 'web',
                        'src': atob(view_source.data.content),
                        'src_script': atob(view_script.data.content),
                        'src_styles': atob(view_styles.data.content)
                    }
                    dfxViews.createFromModel( $scope, new_view ).then( function(view) {
                        dfxMessaging.showMessage( $scope.selected_sample.content.title + ' has been installed!' );
                        $scope.getAll();
                    });
                });
            });
        });

        // Install Resources
       dfxSamples.contents( $scope, $scope.selected_sample.category + '/' + $scope.selected_sample.name + '/resources' ).then( function(resources) {
            for (var i=0; i<resources.data.length; i++) {
                var mime_type;
                var resource_cat;
                var re = /[.]\w+$/;
                var m;
                 
                if ((m = re.exec(resources.data[0].name)) !== null) {
                    if (m.index === re.lastIndex) {
                        re.lastIndex++;
                    }
                    switch (m[0]) {
                        case '.jpg':
                            mime_type = 'image/jpeg';
                            resource_cat = 'assets';
                            break;
                        case '.jpeg':
                            mime_type = 'image/jpeg';
                            resource_cat = 'assets';
                            break;
                        case '.png':
                            mime_type = 'image/png';
                            resource_cat = 'assets';
                            break;
                        case '.gif':
                            mime_type = 'image/gif';
                            resource_cat = 'assets';
                            break;
                        case '.pdf':
                            mime_type = 'application/pdf';
                            resource_cat = 'assets';
                            break;
                        case '.js':
                            mime_type = 'text/javascript';
                            resource_cat = 'javascript';
                            break;
                        case '.json':
                            mime_type = 'text/javascript';
                            resource_cat = 'javascript';
                            break;
                        case '.css':
                            mime_type = 'text/css';
                            resource_cat = 'javascript';
                            break;
                        default:
                            mime_type = 'text/javascript';
                            resource_cat = 'javascript';
                            break;
                    }
                }
                
                $scope.installSampleResource( resources.data[i].name, resources.data[i].path, mime_type, resource_cat );
            }
        });
        

    };

    $scope.installSampleResource = function(resource_name, resource_path, mime_type, resource_cat) {
        
        dfxSamples.contents( $scope, resource_path ).then( function(resource_content) {
            
            var form_data = new FormData();
            
            var bytes;

            if (resource_cat=='assets') {
                var binary = atob(resource_content.data.content);
                var array = [];
                for (var i = 0; i < binary.length; i++) {
                    array.push(binary.charCodeAt(i));
                }

                // Convert the string to bytes
                bytes = new Uint8Array(array);
            } else {
                // Convert the string to bytes
                bytes = atob(resource_content.data.content);
            }
            
            var blob = new Blob([bytes], { type: mime_type});
            form_data.append( 'file', blob, resource_content.data.name);

            $.ajax({
                url: '/studio/resources/simulate_upload/' + $scope.selected_application + '/' + resource_cat,
                type: 'POST',
                data: form_data,
                headers : {'X-DREAMFACE-TENANT' : $('body').attr('data-tenantid')},
                processData: false,
                contentType: false 
            });

        });

    };

}]);

dfxStudioApp.controller("dfx_studio_release_notes_controller", [ '$scope', function($scope) {

}]);

dfxStudioApp.controller("dfx_studio_support_controller", [ '$scope', '$window', function($scope, $window) {
    $scope.openSupportPage = function () {
        $window.open( 'https://interactive-clouds.atlassian.net/servicedesk/customer/portal/1/user/login?destination=portal', '_blank' );
    };
}]);

dfxStudioApp.controller("dfx_studio_contactus_controller", [ '$scope', 'dfxEmail', 'dfxMessaging', 'dfxApplications', function($scope, dfxEmail, dfxMessaging, dfxApplications) {
    $scope.refreshForm = function(){
        $scope.contact_name = {value: ''};
        $scope.contact_email = {value: ''};
        $scope.contact_msg = {value: ''};
        $scope.subject = {value: 'Request for assistance'};
        $scope.show_form = true;

        dfxApplications.getUserInfo().then(function(data){
            if(data.email !== null && data.email !== ""){
                $scope.contact_email.value = data.email;
            }
            if(data.firstName!==""){
                $scope.contact_name.value = data.firstName + ' ' + data.lastName ;
            }else{
                $scope.contact_name.value = data.login ;
            }
        });
    };

    $scope.refreshForm();

    $scope.sendMail = function(){
        var data = {
            contact_name: $scope.contact_name.value,
            contact_email: $scope.contact_email.value,
            contact_msg: $scope.contact_msg.value,
            subject: $scope.subject.value
        };
        dfxEmail.sendMail(data).then(function(res){
            $scope.show_form = false;
        }, function(res){
            dfxMessaging.showWarning('Error occured while trying to send your message.');
        });
    };
}]);

dfxStudioApp.controller("dfx_studio_configuration_controller", [ '$rootScope', '$scope','dfxApplications', '$timeout', '$routeParams', function($rootScope, $scope, dfxApplications, $timeout, $routeParams) {
    $scope.general = {};
    $scope.devops = {};
    $scope.resources = {};
    $scope.api_sources = {};
    $scope.isSidenavOpen = false;
    if(!$scope.app_name){
        $scope.app_name = $routeParams.appname;
    }

    $scope.$watch('$parent.settings', function(newVal){
        var configurations = ['general','devops', 'api_sources', 'resources','users','personalization','deployment'];
        if(configurations.indexOf(newVal) !== -1){
            $scope.settings = newVal;
            $timeout(function(){
                $scope.configurationTabs = $('#dfx-studio-main-content > div > md-tabs > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper').children();
                $($scope.configurationTabs[configurations.indexOf(newVal)]).trigger('click');
            },0);
        }
    });

    $scope.logo_initialized = false;
    $scope.defineAppData = function(appname){
        if($scope.applications){
            for(var i =0; i < $scope.applications.length; i++){
                if($scope.applications[i].name === appname){
                    $scope.general.title = $scope.applications[i].title;
                    if($scope.applications[i].logo){
                        $scope.general.selected_logo_image = $scope.applications[i].logo ;
                    }else{
                        $scope.general.selected_logo_image = "/images/dfx_login_logo_black.png";
                    }
                    $scope.logo_initialized = true;
                    if($scope.applications[i].channel){
                        $scope.devops.channel = $scope.applications[i].channel;
                    }else{
                        $scope.devops.channel = "";
                    }
                }
            }
        }
    };

    $scope.getGithubData = function(){
        dfxApplications.getGithubData($scope.app_name).then(function(data){
            $scope.devops.repository = data.data.reponame;
            $scope.devops.access_token = data.data.access_token;
            $scope.devops.github_username = data.data.username ;
        });
    };

    $scope.defineSettings = function(tab){
        for(var i= 0; i < 7; i++){
            if($scope.configurationTabs && $($scope.configurationTabs[i]).hasClass('md-active')){
                $scope.settings = tab;                                                              // $scope.settings != $scope.$parent.settings
            }
        }
    };

    $scope.initApps = function(){
        dfxApplications.getAll($scope).then(function(apps){
            $scope.applications = apps.data;
            $scope.appTrees = [];
            for(var i =0; i < $scope.applications.length; i++){
                $scope.appTrees.push({});
            }
            $scope.defineAppData($scope.app_name);
            for(var j =0; j < $scope.applications.length; j++){
                (function(){
                    var local = j;
                    dfxApplications.getAppTree($scope, $scope.applications[local].name).then(function(appTree){
                        $scope.appTrees[local] = appTree;
                    })
                })();
            }
        });
    };
    $scope.initApps();
    $scope.getGithubData();
}]);


dfxStudioApp.controller("dfx_studio_new_application_controller", [ '$scope','dfxApplications', '$mdDialog', '$timeout', 'dfxMessaging', function($scope, dfxApplications, $mdDialog, $timeout, dfxMessaging) {
    $scope.current_date = new Date();
    $scope.appl_name = "";
    $scope.appl_title = "";
    $scope.selected_logo_image_input = "" ;
    $scope.isCreate = true;
    $scope.selected_logo_image = '/images/dfx_login_logo_black.png';
    $scope.isLogo = true;

    $timeout(function(){
        dfxApplications.getSharedImages($scope.app_name).then(function(images){
            $scope.sharedImages = images;
        });
    }, 0);

    $scope.createNewApp = function(){
        var alert = '';
        if ($scope.appl_name.indexOf(" ") != -1) {
            alert = "Application name cannot have empty spaces";
        }
        else if ($.isEmptyObject($scope.appl_name)) {
            alert = "Application name cannot be empty";
        }
        else if (!/^[a-zA-Z0-9-_.]+$/.test($scope.appl_name)) {
            alert = "Application name can have only letters, numbers, underscore or dash symbols";
        }
        if (alert) {
            dfxMessaging.showWarning(alert);
        } else {
            var is_unique = true;
            for(var i=0; i < $scope.applications.length; i++){
                if($scope.applications[i].name === $scope.appl_name){
                    is_unique = false;
                    break;
                }
            }
            if(is_unique){
                dfxApplications.createNewApp($scope.appl_name, $scope.appl_title, $scope.selected_logo_image).then(function(){
                    dfxMessaging.showMessage('New application has been successfully created.');
                    $scope.getAll().then(function(){
                        $scope.loadStudioView($scope.appl_name + '/configuration/general') ;
                    });
                }, function(message){
                dfxMessaging.showWarning('Can\'t create new application. ' + message);
                });
            }else{
                dfxMessaging.showWarning("Application with such name is already exist!");
            }
        }
    };

    $scope.chooseLogoImage = function(ev){
        $mdDialog.show({
            scope: $scope.$new(),
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true,
            ariaLabel: 'picker-images',
            templateUrl: '/gcontrols/web/picker_images_form.html',
            controller: function(){
                $scope.setImage = function(src) {
                    $scope.selected_logo_image = src ;
                    $scope.selected_logo_image_input = src ;
                    $mdDialog.hide();
                }
                $scope.closeDialog = function(){
                    $mdDialog.hide();
                }
            }
        })
    };

    $scope.changeLogo = function(logo){
        if(logo === ''){
            $scope.selected_logo_image = '/images/dfx_login_logo_black.png';
        }else{
            $scope.selected_logo_image = logo;
        }
    };

}]);

dfxStudioApp.controller("dfx_studio_general_settings_controller", [ '$scope','dfxApplications', '$mdDialog', 'dfxMessaging', '$timeout', function($scope, dfxApplications, $mdDialog, dfxMessaging, $timeout) {
    var parentScope = $scope.$parent;
    parentScope.general = $scope;
    $scope.isCreate = false;
    $scope.selected_logo_image_input = {value: ""} ;
    $scope.isLogo = true;

    $scope.getGeneral = function(){
        dfxApplications.getGeneral($scope.app_name).then(function(general){
            $scope.general.creationDate = general.creationDate;
        });
    };

    $scope.chooseLogoImage = function(ev){
        $mdDialog.show({
            scope: $scope.$new(),
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true,
            ariaLabel: 'picker-images',
            templateUrl: '/gcontrols/web/picker_images_form.html',
            controller: function(){
                $scope.setImage = function(src) {
                    $scope.selected_logo_image = src ;
                    $scope.selected_logo_image_input.value = src;
                    $mdDialog.hide();
                }
                $scope.closeDialog = function(){
                    $mdDialog.hide();
                }
            }
        })
    };

    $scope.$watch('$parent.logo_initialized', function(newVal){
        if(newVal){
            $scope.selected_logo_image_input.value = $scope.selected_logo_image ;
            $timeout(function(){
                dfxApplications.getImages($scope.app_name).then(function(images){
                    $scope.appImages = images;
                });
                dfxApplications.getSharedImages($scope.app_name).then(function(images){
                    $scope.sharedImages = images;
                });
            }, 0);
        }
    });

    $scope.changeLogo = function(logo){
        if(logo === ''){
            $scope.selected_logo_image = '/images/dfx_login_logo_black.png';
        }else{
            $scope.selected_logo_image = logo;
        }
    };

    $scope.getGeneral();

    $scope.saveGeneral = function(){
        dfxApplications.saveGeneral($scope.general.title, $scope.app_name, $scope.selected_logo_image).then(function(){
            $scope.initApps();
            dfxMessaging.showMessage("General application settings has been successfully saved.");
        }, function(){
            dfxMessaging.showWarning("Can\'t save.");
        });
    };

    $scope.deleteApp = function(){
        dfxApplications.deleteApp($scope.app_name).then(function(){
            $scope.getAll().then(function(){
                $scope.loadStudioView('/home') ;
            });
        });
    };

    $scope.confirmAppDelete = function(ev) {
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want to delete this application?')
            .textContent('Application will be removed permanently from the repository.')
            .ariaLabel('remove app')
            .targetEvent(ev)
            .cancel('Cancel')
            .ok('OK');
        $mdDialog.show(confirm).then(function() {
            $scope.deleteApp();
        }, function() {
        });
    };

    $scope.loadLoginPage = function() {
        dfxApplications.getGeneral($scope.app_name).then(function(data){
            var editor_parent = document.getElementById('login_editor_web');
            $scope.login_editor_web = CodeMirror(function (elt) {
                    $(editor_parent).empty();
                    $(editor_parent).append(elt);
                },
                {
                    lineNumbers: true,
                    value: data.templates.login_page_web,
                    mode: {name: "xml", globalVars: true},
                    matchBrackets: true,
                    highlightSelectionMatches: {showToken: /\w/},
                    styleActiveLine: true,
                    viewportMargin : Infinity,
                    extraKeys: {"Alt-F": "findPersistent", "Ctrl-Space": "autocomplete"},
                    lineWrapping: true
                });
            $scope.login_editor_web.setSize(null, ($(window).height() - 400) + 'px');

            var editor_parent = document.getElementById('login_editor_mobile');
            $scope.login_editor_mobile = CodeMirror(function (elt) {
                    $(editor_parent).empty();
                    $(editor_parent).append(elt);
                },
                {
                    lineNumbers: true,
                    value: data.templates.login_page_mobile,
                    mode: {name: "xml", globalVars: true},
                    matchBrackets: true,
                    highlightSelectionMatches: {showToken: /\w/},
                    styleActiveLine: true,
                    viewportMargin : Infinity,
                    extraKeys: {"Alt-F": "findPersistent", "Ctrl-Space": "autocomplete"},
                    lineWrapping: true
                });
            $scope.login_editor_mobile.setSize(null, ($(window).height() - 400) + 'px')
        });
    };

    $scope.saveLoginPage = function() {
        var obj = {
            application : $scope.app_name,
            data : {
                templates : {
                    login_page_mobile : $scope.login_editor_mobile.getValue(),
                    login_page_web : $scope.login_editor_web.getValue()
                }
            }
        }
        dfxApplications.saveLoginPage(obj).then(function(){
            dfxMessaging.showMessage("Login page has been successfully saved.");
        }, function(){
            dfxMessaging.showWarning("Can\'t save.");
        });
    }

}]);

dfxStudioApp.controller("dfx_studio_devops_controller", [ '$scope','dfxApplications', 'dfxMessaging', function($scope, dfxApplications, dfxMessaging) {
    var parentScope = $scope.$parent;
    parentScope.devops = $scope;

    $scope.saveCollaboration = function(){
        dfxApplications.saveCollaboration($scope.devops.channel, $scope.app_name).then(function(){
            $scope.initApps();
            dfxMessaging.showMessage("Collaboration data has been successfully saved.");
        }, function(){
            dfxMessaging.showWarning("Can\'t save.");
        });
    };

    $scope.saveGithub = function(){
        var body = {
            "application": $scope.app_name,
            "provider": "github",
            "access_token": $scope.access_token,
            "repository": $scope.repository,
            "repositories": [
                {
                    "reponame": $scope.repository,
                    "username": $scope.github_username
                }
            ]
        };
        dfxApplications.saveGithub(body).then(function(){
            $scope.getGithubData();
            dfxMessaging.showMessage("Github data has been successfully saved.");
        }, function(){
            dfxMessaging.showWarning("Can\'t save.");
        });
    };
}]);

dfxStudioApp.controller("dfx_studio_api_sources_controller", [ '$scope','dfxAuthProviders', 'dfxMessaging', '$mdDialog', '$mdSidenav', 'dfxApiServiceObjects', '$timeout', function($scope, dfxAuthProviders, dfxMessaging, $mdDialog, $mdSidenav, dfxApiServiceObjects, $timeout) {
    var parentScope = $scope.$parent;
    parentScope.api_sources = $scope;
    $scope.auth_providers = [];
    $scope.operation = 'create' ;
    $scope.new_auth_provider = {} ;
    $scope.current_auth_provider = {} ;
    $scope.dataSources = [];
    $scope.schemas = [];
    $scope.schema_on_open = "init";
    $scope.schema_on_close = "init";
    $scope.type_on_open = "init";
    $scope.type_on_close = "init";
    dfxApiServiceObjects.getCatalog().then(function(data){
        var sources = data.data ;
        $scope.dataSources.push({name: 'REST', schemas:['none', 'basic','digest', 'oAuth1', 'oAuth2']}) ;
        $scope.dataSources.push({name: 'StrongLoop', schemas:['none','basic','digest']}) ;
        for(var key in sources){
            if(sources[key].auth){
                $scope.dataSources.push({
                    name: key,  schemas: sources[key].schemas
                }) ;
            }
        }
    });

    $scope.$watch('new_auth_provider.selected_data_source', function(newVal){
        if(newVal){
            for(var i = 0; i < $scope.dataSources.length; i++){
                if($scope.dataSources[i].name === newVal){
                    $scope.schemas = $scope.dataSources[i].schemas ;
                }
            }
        }
    });

    $scope.$watch('current_auth_provider.dataSource', function(newVal){
        if(newVal){
            for(var i = 0; i < $scope.dataSources.length; i++){
                if($scope.dataSources[i].name === newVal){
                    $scope.schemas = $scope.dataSources[i].schemas ;
                }
            }
        }
    });

    $scope.getProviders = function(){
        dfxAuthProviders.getProviders($scope.app_name).then(function(data){
            $scope.auth_providers = data;
        });
    };

    $scope.getProviders();

    var facebook_credentials = {
        type:               "facebook",
        access_token:       "",
        consumer_key:       "",
        consumer_secret:    "",
        authorize_path:     "https://www.facebook.com/dialog/oauth",
        access_token_path:  "https://graph.facebook.com/v2.3/oauth/access_token",
        response_type:      "code",
        scope:              ""
    };
    var google_credentials = {
        type:               "google",
        access_token:       "",
        base_provider_url:  "https://accounts.google.com",
        consumer_key:       "",
        consumer_secret:    "",
        authorize_path:     "/o/oauth2/auth",
        access_token_path:  "/o/oauth2/token",
        response_type:      "code",
        scope:              ""
    };

    $scope.initNewAuthProvider = function(){
        $scope.operation = 'create';
        $scope.schemas = ['none','basic','digest', 'oAuth1', 'oAuth2'];
        $scope.new_auth_provider = {
            provider:                    "",
            selected_data_source:        "REST",
            schema:                      "",
            ap_basic_digest:             {credentials: {username: "", password: ""}},
            ap_oAuth_1:                  {credentials: {selected_method: "HMAC-SHA1", consumer_key:"", consumer_secret:"", access_token:"", access_secret:""}},
            ap_oAuth_2:                  {selected_type: "", credentials: {}},
            rest:                         {credentials: {}, route: ""}
        };
        var sideNavInstance = $mdSidenav('side_nav_left');
        sideNavInstance.toggle();
    };

    $scope.saveProvider = function(){
        if($scope.operation === "create"){
            var alert = '';
            if ($scope.new_auth_provider.provider.indexOf(" ") != -1) {
                alert = "The name cannot have empty spaces";
            }
            else if ($.isEmptyObject($scope.new_auth_provider.provider)) {
                alert = "The name cannot be empty";
            }
            else if (!/^[a-zA-Z0-9-_.]+$/.test($scope.new_auth_provider.provider)) {
                alert = "The name can have only letters, numbers, underscore or dash symbols";
            }
            if (alert) {
                dfxMessaging.showWarning(alert);
            } else {
                var is_unique = true;
                for(var i=0; i < $scope.auth_providers.length; i++){
                    if($scope.auth_providers[i].provider === $scope.new_auth_provider.provider){
                        is_unique = false;
                        break;
                    }
                }
                if(is_unique){
                    dfxAuthProviders.createProvider($scope.new_auth_provider.schema, $scope.new_auth_provider, $scope.app_name).then(function(data){
                        $scope.auth_providers.push($scope.new_auth_provider);
                        dfxMessaging.showMessage("New API source data has been successfully created.");
                        var sideNavInstance = $mdSidenav('side_nav_left');
                        sideNavInstance.toggle();
                    });
                }else{
                    dfxMessaging.showWarning("API source with such name is already exist!");
                }
            }
        }else if($scope.operation === "update"){
            dfxAuthProviders.saveProvider($scope.current_auth_provider.schema, $scope.current_auth_provider, $scope.app_name).then(function(data){
                $scope.getProviders();
                dfxMessaging.showMessage("API source data has been successfully saved.");
                var sideNavInstance = $mdSidenav('side_nav_left');
                sideNavInstance.toggle();
            });
        }
    };

    $scope.closeSidenav = function(){
        var sideNavInstance = $mdSidenav('side_nav_left');
        sideNavInstance.toggle();
    };

    $scope.editAuthProvider = function(providername) {
        $scope.operation = "update" ;
        $scope.schema_on_open = "init";
        $scope.schema_on_close = "init";
        $scope.type_on_open = "init";
        $scope.type_on_close = "init";
        dfxAuthProviders.getProvider(providername, $scope.app_name).then(function (data) {
            $scope.current_auth_provider = data;
            if (!$scope.current_auth_provider.credentials.type) {
                $scope.current_auth_provider.selected_type = "";
            }
            for(var i = 0; i < $scope.dataSources.length; i++){
                if($scope.dataSources[i].name === $scope.current_auth_provider.dataSource){
                    $scope.schemas = $scope.dataSources[i].schemas ;
                }
            }

            var sideNavInstance = $mdSidenav('side_nav_left');
            sideNavInstance.toggle();
        });
    };

    $scope.confirmProviderRemove = function(ev, providername) {
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want to delete this API source?')
            .textContent('API source will be removed from the repository.')
            .ariaLabel('remove api_source')
            .targetEvent(ev)
            .cancel('Cancel')
            .ok('OK');
        $mdDialog.show(confirm).then(function() {
            $scope.removeProvider(providername);
        }, function() {
        });
    };

    $scope.removeProvider = function(providername){
        dfxAuthProviders.removeProvider($scope.app_name, providername).then(function(){
            for(var i =0; i < $scope.auth_providers.length; i++){
                if($scope.auth_providers[i].provider === providername){
                    $scope.auth_providers.splice(i, 1);
                    break;
                }
            }
            dfxMessaging.showMessage('Api source data has been successfully deleted.');
        });
    };

    $scope.$watch('new_auth_provider.ap_oAuth_2.selected_type', function(newVal){
        if(newVal === 'facebook'){
            $scope.api_sources.new_auth_provider.ap_oAuth_2.credentials = facebook_credentials ;
        }else if(newVal === 'google'){
            $scope.api_sources.new_auth_provider.ap_oAuth_2.credentials = google_credentials ;
        }
    });

    $scope.setSchemaOnOpen = function(schema){
        $scope.schema_on_open = schema;
    };

    $scope.setSchemaOnClose = function(schema){
        $scope.schema_on_close = schema;
    };

    $scope.setTypeOnOpen = function(type){
        $scope.type_on_open = type;
    };

    $scope.setTypeOnClose = function(type){
        $scope.type_on_close = type;
    };

    $scope.$watch('current_auth_provider.schema',  function(newVal){
        if($scope.schema_on_open !== $scope.schema_on_close){
            if(newVal === 'basic' || newVal === 'digest'){
                $scope.current_auth_provider.credentials = {username: "", password: ""};
            }else if(newVal === 'oAuth1'){
                $scope.current_auth_provider.credentials = {
                    signature_method:       "HMAC-SHA1",
                    consumer_key:           "",
                    consumer_secret:        "",
                    access_token:           "",
                    access_secret :         ""
                };
            }else if(newVal === 'none'){
                $scope.current_auth_provider.route = "" ;
                $scope.current_auth_provider.credentials = {};
            }else if(newVal === 'oAuth2'){
                $scope.current_auth_provider.credentials = {
                    type:               "",
                    access_token:       "",
                    consumer_key:       "",
                    consumer_secret:    "",
                    authorize_path:     "",
                    base_site:          "",
                    access_token_path:  "",
                    response_type:      "",
                    scope:              ""
                };
            }
        }
    });

    $scope.$watch('current_auth_provider.credentials.type', function(newVal){
        if($scope.type_on_open !== $scope.type_on_close){
            if(newVal === 'facebook'){
                $scope.current_auth_provider.credentials = {
                    type:               "facebook",
                    access_token:       "",
                    consumer_key:       "",
                    consumer_secret:    "",
                    authorize_path:     "https://www.facebook.com/dialog/oauth",
                    access_token_path:  "https://graph.facebook.com/v2.3/oauth/access_token",
                    response_type:      "code",
                    scope:              ""
                };
            }else if(newVal === 'google'){
                $scope.current_auth_provider.credentials = {
                    type:               "google",
                    access_token:       "",
                    base_provider_url:  "https://accounts.google.com",
                    consumer_key:       "",
                    consumer_secret:    "",
                    authorize_path:     "/o/oauth2/auth",
                    access_token_path:  "/o/oauth2/token",
                    response_type:      "code",
                    scope:              ""
                };
            }
            $scope.current_auth_provider.selected_type = $scope.current_auth_provider.credentials.type ;
        }
    });

    /*$scope.$watch('new_auth_provider.schema', function(newVal){
     if(newVal){
     $scope.new_auth_provider.selected_data_source = "";
     if(newVal = 'public/rest'){
     $scope.new_auth_provider.rest.route = "";
     $scope.new_auth_provider.selected_data_source = "StrongLoop" ;
     $scope.new_auth_provider.credentials = {};
     }
     }
     });*/
}]);

//dfxStudioApp.controller("dfx_studio_resources_controller", [ '$scope', function($scope) {
//    $scope.click = function() {
//        $scope.path = "studioviews/resources.html";
//    }
//    $scope.javascript = {};
//    $scope.dictionary = {};
//    $scope.stylesheets = {};
//    $scope.assets = {};
//
//}]);

dfxStudioApp.directive('dropzone', ['dfxApplications','$timeout', '$mdDialog', 'dfxMessaging', '$compile', '$parse', function(dfxApplications, $timeout, $mdDialog, dfxMessaging, $compile, $parse) {
    return {
        restrict: 'C',
        scope: true,
        link: function(scope, element, attrs) {
            var mimeTypes = {
                dictionary:  '.json',
                javascript:  'text/javascript,application/javascript',
                stylesheets: 'text/css',
                assets:      'image/jpeg,image/png,image/gif,application/pdf,text/xml'
            };

            var dropzone_id = $(element[0]).attr("id");
            scope.resource_name = {value : ""};
            scope.dictionary_name = {value : ""};
            scope.current_resource_type = "javascript";
            scope.hide_areas = false;
            scope.create_new = true;

            switch(dropzone_id){
                case "dfx_resource_dictionary_folder_upload":
                    scope.current_resource_type = "dictionary";
                    break;
                case "dfx_resource_javascript_folder_upload":
                    scope.current_resource_type = "javascript";
                    break;
                case "dfx_resource_stylesheets_folder_upload":
                    scope.current_resource_type = "stylesheets";
                    break;
                case "dfx_resource_assets_folder_upload":
                    scope.current_resource_type = "assets";
            }

            var parentScope = scope.$parent;
            if(scope.current_resource_type === "dictionary"){
                parentScope.dictionary = scope;
            }else if (scope.current_resource_type === "javascript"){
                parentScope.javascript = scope;
            }else if(scope.current_resource_type === "stylesheets"){
                parentScope.stylesheets = scope;
            }else if(scope.current_resource_type === "assets"){
                parentScope.assets = scope;
            }

            if(!parentScope.dictionary.data){
                parentScope.dictionary.data = {
                    application: scope.app_name,
                    name: "dictionary",
                    description: '',
                    action: 'put',
                    items: []
                };
            }

            if(!parentScope.javascript.data){
                parentScope.javascript.data = {
                    application: scope.app_name,
                    name: "javascript",
                    description: '',
                    action: 'put',
                    items: []
                };
            }

            if(!parentScope.stylesheets.data){
                parentScope.stylesheets.data = {
                    application: scope.app_name,
                    name: "stylesheets",
                    description: '',
                    action: 'put',
                    items: []
                };
            }

            if(!parentScope.assets.data){
                parentScope.assets.data = {
                    application: scope.app_name,
                    name: "assets",
                    description: '',
                    action: 'put',
                    items: []
                };
            }

            scope.getResources = function(){
                dfxApplications.getResources(scope.app_name).then(function(response){
                    var arr = response.data.data;
                    for(var i =0; i < arr.length; i++){
                        if(arr[i].name === "javascript" && scope.current_resource_type === "javascript"){
                            parentScope.javascript.data.items = arr[i].items;
                            for(var j=0; j < parentScope.javascript.data.items.length; j++){
                                parentScope.javascript.data.items[j].is_uploaded = true;
                            }
                        }else if(arr[i].name === "stylesheets" && scope.current_resource_type === "stylesheets"){
                            parentScope.stylesheets.data.items = arr[i].items;
                            for(var j=0; j < parentScope.stylesheets.data.items.length; j++){
                                parentScope.stylesheets.data.items[j].is_uploaded = true;
                            }
                        }else if(arr[i].name === "assets" && scope.current_resource_type === "assets"){
                            parentScope.assets.data.items = arr[i].items;
                            for(var j=0; j < parentScope.assets.data.items.length; j++){
                                parentScope.assets.data.items[j].is_uploaded = true;
                            }
                        }
                    }
                }, function(){
                    dfxMessaging.showWarning("Can\'t get list of resources");
                });
            };

            scope.getDataDictionaries = function(){
                dfxApplications.getDataDictionaries(scope.app_name).then(function(response){
                    parentScope.dictionary.data.items = response.data.data;
                }, function(){
                    dfxMessaging.showWarning("Can\'t get list of data dictionaries.");
                });
            };

            if(scope.current_resource_type === 'dictionary'){
                $timeout(function(){
                    scope.getDataDictionaries();
                },0);
            }else{
                scope.getResources();
            };

            scope.uploadResources = function(){
                dfxApplications.saveResources(scope.data).then(function(response){
                    for(var i =0; i < scope.data.items.length; i++){
                        scope.data.items[i].is_uploaded = true;
                    }
                    scope.processDropzone();
                    dfxMessaging.showMessage("Resources data has been successfully updated.");
                }, function(){
                    dfxMessaging.showWarning("Can\'t save.");
                });
            };

            scope.confirmResourceDelete = function(ev, item) {
                var confirm = $mdDialog.confirm()
                    .title('Are you sure you want to delete this file?')
                    .textContent('The file will be removed permanently from the repository.')
                    .ariaLabel('remove file')
                    .targetEvent(ev)
                    .cancel('Cancel')
                    .ok('OK');
                $mdDialog.show(confirm).then(function() {
                    scope.deleteItem(item);
                }, function() {
                });
            };

            scope.confirmDictionaryDelete = function(ev, item) {
                var confirm = $mdDialog.confirm()
                    .title('Are you sure you want to delete this item?')
                    .textContent('This item will be removed permanently from the repository.')
                    .ariaLabel('remove dictionary')
                    .targetEvent(ev)
                    .cancel('Cancel')
                    .ok('OK');
                $mdDialog.show(confirm).then(function() {
                    scope.deleteDictionaryItem(item);
                }, function() {
                });
            };

            scope.deleteDictionaryItem = function(item){
                dfxApplications.removeDataDictionary(item.name, scope.app_name).then(function(){
                    scope.getDataDictionaries();
                    dfxMessaging.showMessage("Data dictionary " + item.name + " has been successfully deleted.");
                });
            };

                scope.deleteItem = function(item){
                if(scope.current_resource_type === "javascript"){
                    for(var i=0; i < parentScope.javascript.data.items.length; i++){
                        if(parentScope.javascript.data.items[i].path === item.path){
                            parentScope.javascript.data.items.splice(i, 1);
                            $timeout(function(){
                                $('#upload-javascript-resources').trigger('click');
                            },0);
                            break;
                        }
                    }
                }else if(scope.current_resource_type === "stylesheets"){
                    for(var j=0; j < parentScope.stylesheets.data.items.length; j++){
                        if(parentScope.stylesheets.data.items[j].path === item.path){
                            parentScope.stylesheets.data.items.splice(j, 1);
                            $timeout(function(){
                                $('#upload-stylesheets-resources').trigger('click');
                            },0);
                            break;
                        }
                    }
                }else if(scope.current_resource_type === "assets"){
                    for(var j=0; j < parentScope.assets.data.items.length; j++){
                        if(parentScope.assets.data.items[j].path === item.path){
                            parentScope.assets.data.items.splice(j, 1);
                            $timeout(function(){
                                $('#upload-assets-resources').trigger('click');
                            },0);
                            break;
                        }
                    }
                }
            };

            scope.config = {
                maxFilesize: 100,
                paramName: "uploadfile",
                maxThumbnailFilesize: 10,
                url: '/studio/resources/upload/' + scope.app_name + '/' + scope.current_resource_type,
                acceptedFiles:    mimeTypes[scope.current_resource_type],
                uploadMultiple:   true,
                autoProcessQueue: false,
                maxFiles:         1000,
                parallelUploads:  1000
            };

            scope.dropzone = new Dropzone(element[0], scope.config);

            var eventHandlers = {
                'addedfile': function(file) {
                    var is_unique = true;
                    for(var i =0; i < scope.data.items.length; i++){
                        if(file.name === scope.data.items[i].path){
                            dfxMessaging.showWarning("Current file name " + file.name + " is already exist!");
                            is_unique = false;
                            this.removeFile(file);
                            break;
                        }
                    }
                    if(is_unique){
                        scope.data.items.push({
                            'path': file.name,
                            'type': file.type,
                            'size': (file.size/1000).toFixed(1),
                            'is_uploaded': false
                        });
                    }

                    if(scope.current_resource_type === "javascript"){
                        $( "#dfx_resource_javascript_folder_upload .dz-file-preview").remove();
                        $("#dfx_resource_javascript_folder_upload > div.dz-default.dz-message").css('opacity', '1');
                        $timeout(function(){
                            $('#upload-javascript-resources').trigger('click');
                        },0);
                    }else if(scope.current_resource_type === "stylesheets"){
                        $( "#dfx_resource_stylesheets_folder_upload .dz-file-preview" ).remove();
                        $("#dfx_resource_stylesheets_folder_upload > div.dz-default.dz-message").css('opacity', '1');
                        $timeout(function(){
                            $('#upload-stylesheets-resources').trigger('click');
                        },0);
                    }else if(scope.current_resource_type === "assets"){
                        $( "#dfx_resource_assets_folder_upload .dz-file-preview" ).remove();
                        $("#dfx_resource_assets_folder_upload > div.dz-default.dz-message").css('opacity', '1');
                        $timeout(function(){
                            $('#upload-assets-resources').trigger('click');
                        },0);
                    }
                },
                'success': function (file, response) {

                }
            };

            scope.createResource = function(ev) {
                scope.create_new = true;
                $mdDialog.show({
                    scope: scope.$new(),
                    controller: DialogController,
                    templateUrl: 'studioviews/create_resource_dialog.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose:true
                })
                    .then(function() {
                        var alert = '';
                        if(scope.current_resource_type === "dictionary"){
                            if (scope.dictionary_name.value.indexOf(" ") != -1) {
                                alert = "The name cannot have empty spaces";
                            }
                            else if ($.isEmptyObject(scope.dictionary_name.value)) {
                                alert = "The name cannot be empty";
                            }
                            else if (!/^[a-zA-Z0-9-_.]+$/.test(scope.dictionary_name.value)) {
                                alert = "The name can have only letters, numbers, underscore or dash symbols";
                            }
                        }else{
                            if (scope.resource_name.value.indexOf(" ") != -1) {
                                alert = "The name cannot have empty spaces";
                            }
                            else if ($.isEmptyObject(scope.resource_name.value)) {
                                alert = "The name cannot be empty";
                            }
                            else if (!/^[a-zA-Z0-9-_.]+$/.test(scope.resource_name.value)) {
                                alert = "The name can have only letters, numbers, underscore or dash symbols";
                            }
                        }

                        if (alert) {
                            dfxMessaging.showWarning(alert);
                        } else {
                            var is_unique = true;
                            if(scope.current_resource_type === "dictionary"){
                                for(var i =0; i < scope.data.items.length; i++){
                                    if((scope.dictionary_name.value) === scope.data.items[i].name){
                                        dfxMessaging.showWarning("Current item name " + scope.dictionary_name.value + " is already exist!");
                                        is_unique = false;
                                        break;
                                    }
                                }
                            }else if(scope.current_resource_type === "javascript"){
                                for(var i =0; i < scope.data.items.length; i++){
                                    if((scope.resource_name.value+'.js') === scope.data.items[i].path){
                                        dfxMessaging.showWarning("Current file name " + scope.resource_name.value + ".js is already exist!");
                                        is_unique = false;
                                        break;
                                    }
                                }
                            }else if(scope.current_resource_type === "stylesheets"){
                                for(var j =0; j < scope.data.items.length; j++){
                                    if((scope.resource_name.value+'.css') === scope.data.items[j].path){
                                        dfxMessaging.showWarning("Current file name " + scope.resource_name.value + ".css is already exist!");
                                        is_unique = false;
                                        break;
                                    }
                                }
                            }
                            if(is_unique){
                                if(scope.current_resource_type === 'dictionary'){
                                    scope.saveNewDictionary() ;
                                }else{
                                    scope.scriptEditorBuilder(scope.current_resource_type, "");
                                }
                            }
                        }

                    }, function() {
                        // if cancel
                    });

                function DialogController($scope, $mdDialog) {
                    $scope.hide = function() {
                        $mdDialog.hide();
                    };
                    $scope.cancel = function() {
                        scope.resource_name.value = "";
                        scope.dictionary_name.value = "";
                        $mdDialog.cancel();
                    };
                }
            };

            scope.editResource = function(filename, index){
                scope.create_new = false;
                var edited = {
                    applicationName: scope.app_name,
                    component: "resources",
                    name: scope.current_resource_type,
                    number: index,
                    action: "getResourceContent"
                };
                scope.resource_name.value = filename.substring(0, filename.lastIndexOf('.'));

                dfxApplications.getResourceContent(edited).then(function(data){
                    scope.scriptEditorBuilder(scope.current_resource_type, data.content);
                });
            };

            scope.editDataDictionary = function(item){
                scope.edited_dictionary_name = item.name;
                var temp = JSON.parse(item.content);
                scope.scriptEditorBuilder(scope.current_resource_type, JSON.stringify(temp, null, "\t"));
            };

            scope.scriptEditorBuilder = function(resource_type, value){
                $timeout(function() {
                    var editor_parent;
                    if(resource_type === "dictionary"){
                        editor_parent = document.getElementById('dd_code_mirror_parent');
                    } if(resource_type === "javascript"){
                        editor_parent = document.getElementById('js_code_mirror_parent');
                    }else if(resource_type === "stylesheets"){
                        editor_parent = document.getElementById('css_code_mirror_parent');
                    }
                    scope.script_editor = CodeMirror(function (elt) {
                            $(editor_parent).empty();
                            $(editor_parent).append(elt);
                        },
                        {
                            lineNumbers: true,
                            value: value,
                            mode: {name: resource_type, globalVars: true},
                            matchBrackets: true,
                            highlightSelectionMatches: {showToken: /\w/},
                            styleActiveLine: true,
                            viewportMargin : Infinity,
                            extraKeys: {"Alt-F": "findPersistent", "Ctrl-Space": "autocomplete"},
                            lineWrapping: true
                        });
                    scope.script_editor.setSize(null, ($(window).height() - 400) + 'px');
                    $timeout(function(){
                        scope.script_editor.refresh();
                        scope.script_editor.focus();
                    },0);
                    scope.hide_areas = true;
                }, 0);
            };

            scope.itemJsonEditor = function(value){
                $timeout(function() {
                    var editor_parent = document.getElementById('dd_editor_code_mirror_parent');
                    scope.dd_script_editor = CodeMirror(function (elt) {
                            $(editor_parent).empty();
                            $(editor_parent).append(elt);
                        },
                        {
                            lineNumbers: true,
                            value: value,
                            mode: {name: 'javascript', globalVars: true, json: true},
                            matchBrackets: true,
                            highlightSelectionMatches: {showToken: /\w/},
                            styleActiveLine: true,
                            viewportMargin : Infinity,
                            extraKeys: {"Alt-F": "findPersistent", "Ctrl-Space": "autocomplete"},
                            lineWrapping: true,
                            readOnly: true
                        });
                    scope.dd_script_editor.setSize(null, '340px');
                    $timeout(function(){
                        scope.dd_script_editor.refresh();
                    },0);
                }, 0);
            };

            scope.closeEditor = function(){
                scope.hide_areas = false;
                scope.resource_name.value = "";
                scope.dictionary_name.value = "";
            };

            scope.saveNewResource = function(){
                var content = scope.script_editor.getValue();
                var file_name = scope.resource_name.value + (scope.current_resource_type==="javascript"? ".js" :(scope.current_resource_type==="stylesheets"? ".css": ".json"));
                var body = {
                    action : "createResourceFile",
                    fileName : file_name,
                    content : content,
                    name : scope.current_resource_type,
                    applicationName : scope.app_name
                }
                dfxApplications.createResource(body).then(function(){
                    scope.getResources();
                    scope.closeEditor();
                    dfxMessaging.showMessage("File " + file_name + " was created!");
                });
            };

            scope.saveNewDictionary = function(){
                var content = {Item: "empty"} ;
                var name = scope.dictionary_name.value;
                var data = {
                    name      : scope.dictionary_name.value,
                    content   : JSON.stringify(content)
                };
                dfxApplications.saveDictionary(scope.app_name, data).then(function(res){
                    scope.getDataDictionaries();
                    dfxMessaging.showMessage("Data dictionary " + name + " was created!");
                });
            };

            scope.updateDictionary = function(){
                var content = scope.script_editor.getValue();
                var valid = true;
                try{
                    JSON.parse(content) ;
                }catch(e){
                    valid = false;
                    dfxMessaging.showMessage("Can'\t save. JSON string is not valid!");
                }
                if(valid){
                    var data = {
                        name      : scope.edited_dictionary_name,
                        content   : content
                    };
                    dfxApplications.saveDictionary(scope.app_name, data).then(function(res){
                        scope.getDataDictionaries();
                        scope.closeEditor();
                        dfxMessaging.showMessage("Data dictionary " + scope.edited_dictionary_name + " has been successfully saved.");
                    });
                }
            };

            scope.updateResource = function(){
                var content = scope.script_editor.getValue();
                var file_name = scope.resource_name.value + (scope.current_resource_type==="javascript"? ".js" :(scope.current_resource_type==="stylesheets"? ".css": ".json"));
                var body = {
                    action : "updateResourceFile",
                    fileName : file_name,
                    content : content,
                    name : scope.current_resource_type,
                    applicationName : scope.app_name
                };
                dfxApplications.updateResource(body).then(function(){
                    scope.getResources();
                    scope.closeEditor();
                    dfxMessaging.showMessage("File " + file_name + " was saved!");
                });
            };

            scope.iterate = function(obj, path) {
                scope.result += "<ul>" ;
                for (var property in obj) {
                    scope.result += "<li class='menu-tree-item' item-id='" + scope.counter + "' id='jsonitem_" + scope.counter + "'>" ;
                    scope.result += "<a style='cursor:pointer;' ng-click='selectItem(" + scope.counter + ")'>" + property+ "</a>";
                    if (obj.hasOwnProperty(property)) {
                        if (typeof obj[property] == "object" && obj[property].constructor !== Array) {
                            var path1 = path + "." + property;
                            scope.buffer.push({key: property, value: obj[property], itemId: scope.counter++, path: path1, type: "Object" });
                            scope.iterate(obj[property], path1);
                        }else if(obj[property].constructor === Array){
                            var path1 = path + "." + property;
                            scope.buffer.push({key: property, value: obj[property], itemId: scope.counter++, path: path1, type: "Array" });
                        }else{
                            var path1 = path + "." + property;
                            scope.buffer.push({key: property, value: obj[property], itemId: scope.counter++, path: path1, type: "String"});
                        }
                    }
                    scope.result += "</li>" ;
                }
                scope.result += "</ul>" ;
            };

            scope.refreshBuffer = function(){
                var obj = scope.obj;
                scope.buffer = [];
                scope.result = "";
                scope.counter = 0;
                scope.iterate(obj, "");
            };

            scope.buildStructure = function(){
                $('#items-list').html(scope.result);
                $compile($('#items-list').contents())(scope);
            };

            scope.graphicalEdit = function(ev, item){
                $mdDialog.show({
                    scope: scope.$new(),
                    templateUrl: 'studioviews/json_graphical_editor.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose:true,
                    onComplete: function() {

                        scope.saveDictionary = function(){
                            var temp = JSON.stringify(scope.obj);
                            var data = {
                                name      : item.name,
                                content   : temp
                            };
                            dfxApplications.saveDictionary(scope.app_name, data).then(function(res){
                                scope.getDataDictionaries();
                                scope.closeDialog();
                                dfxMessaging.showMessage("Data dictionary " + item.name + " has been successfully saved.");
                            });
                        };

                        scope.selectItem = function(id){
                            scope.refreshBuffer();
                            scope.selectedItem = scope.buffer[id];
                            scope.selectedItem.displayValue = false;
                            if(scope.selectedItem.value.constructor === Array){
                                scope.selectedItem.displayValue = true;
                                scope.arrayValue = scope.selectedItem.value[0];
                            }else if(typeof scope.selectedItem.value !== "object"){
                                scope.selectedItem.displayValue = true;
                            }
                            $timeout(function(){
                                $($('#items-list').find('.active')[0]).removeClass('active');
                                $('#jsonitem_'+id).addClass('active');
                            },0);
                            scope.itemJsonEditor(JSON.stringify(scope.selectedItem.value, null, "\t"));

                            scope.parentItem = eval(('scope.obj' + scope.selectedItem.path).substring(0, ('scope.obj' + scope.selectedItem.path).lastIndexOf('.')));

                            scope.levelItems = Object.keys(scope.parentItem);
                            var levelHtmlList = $($('#jsonitem_'+id).parent()[0]).children();

                            scope.htmlLevelIds = [];
                            for(var i=0; i < levelHtmlList.length; i++){
                                var temp = parseInt($(levelHtmlList[i]).attr('item-id')) ;
                                scope.htmlLevelIds.push(temp) ;
                            }

                            scope.isTopLevel = false;

                            for(var j=0; j < scope.htmlLevelIds.length; j++){
                                if(scope.htmlLevelIds[j]=== 0){
                                    scope.isTopLevel = true;
                                    break;
                                }
                            }
                        };

                        scope.selectItem(0);

                        scope.addNewItem = function(){
                            var isKeyUnique = true;
                                for(var key in scope.obj){
                                    if(key === scope.keyName){
                                        isKeyUnique = false;
                                        dfxMessaging.showWarning('Can\'t add new item because such key name is already exist in this object.');
                                        break;
                                    }
                                }
                                if(scope.keyName === ""){
                                    dfxMessaging.showWarning('Can\'t add new item because of empty key name.');
                                    return;
                                }
                                if(isKeyUnique){
                                    if(scope.selectedItem === null){
                                    if(scope.defaultType === 'String'){
                                        scope.obj[scope.keyName] = "" ;
                                    }else if(scope.defaultType === 'Object'){
                                        scope.obj[scope.keyName] = {} ;
                                    }else if(scope.defaultType === 'Array'){
                                        scope.obj[scope.keyName] = [];
                                    }
                                }else{
                                        if(scope.defaultType === 'String'){
                                            eval("scope.obj" + scope.selectedItem.path.substring(0, scope.selectedItem.path.lastIndexOf('.')) + "[scope.keyName]=''");
                                        }else if(scope.defaultType === 'Object'){
                                            eval("scope.obj" + scope.selectedItem.path.substring(0, scope.selectedItem.path.lastIndexOf('.')) + "[scope.keyName]={}");
                                        }else if(scope.defaultType === 'Array'){
                                            eval("scope.obj" + scope.selectedItem.path.substring(0, scope.selectedItem.path.lastIndexOf('.')) + "[scope.keyName]=[]");
                                        }
                                    }
                            }
                            var parentCounter = 0;
                            var parentIndex = 0;
                            var parentIndexDefind = false;
                            var arr = scope.selectedItem.path.split('.');
                            arr.pop();
                            var path = arr.join('.') ;

                            for(var i = 0; i < scope.buffer.length; i++){
                                if(scope.buffer[i].path.indexOf(path)!== -1){
                                    if(!parentIndexDefind){
                                        parentIndex = i;
                                        parentIndexDefind = true;
                                    }
                                    parentCounter ++;
                                }
                            }
                            var index = parentIndex + parentCounter;
                            scope.refreshBuffer();
                            scope.buildStructure();
                            scope.selectItem(index);
                        };

                        scope.indent = function(){
                            for(var j =1; j < scope.htmlLevelIds.length; j++){
                                if(scope.htmlLevelIds[j] === scope.selectedItem.itemId){
                                    var index = scope.htmlLevelIds[j-1];
                                    var prevObj = scope.buffer[index] ;
                                }
                            }
                            if(prevObj){
                                if(prevObj.type==='Object'){
                                    var index = scope.selectedItem.itemId;
                                    eval('scope.obj' + prevObj.path + "[scope.selectedItem.key] = scope.selectedItem.value ;");
                                    scope.removeItem();
                                    scope.refreshBuffer();
                                    scope.buildStructure();
                                    scope.selectItem(index);
                                }
                            }
                        };

                        scope.outdent = function(){
                            if(!scope.isTopLevel){
                                    var itemCounter = 0;
                                    var parentCounter = 0;
                                    var parentIndex = 0;
                                    var parentIndexDefind = false;
                                    var arr = scope.selectedItem.path.split('.');
                                    arr.pop(); arr.pop();
                                    var path = arr.join('.') ;

                                    for(var i = 0; i < scope.buffer.length; i++){
                                        if(scope.buffer[i].path.indexOf(path)!== -1){
                                            if(!parentIndexDefind){
                                                parentIndex = i;
                                                parentIndexDefind = true;
                                            }
                                            parentCounter ++;
                                        }
                                    }

                                    for(var j = scope.selectedItem.itemId; j < scope.buffer.length; j++){
                                        if(scope.buffer[j].path.indexOf(scope.selectedItem.path)!== -1){
                                            itemCounter ++;
                                        }
                                    }
                                    var index = parentIndex + parentCounter - itemCounter;

                                eval('scope.obj' + path + "[scope.selectedItem.key] = scope.selectedItem.value ;");
                                scope.removeItem();
                                scope.refreshBuffer();
                                scope.buildStructure();
                                scope.selectItem(index);
                            }
                        };

                        scope.moveUp = function(){
                            var doModify = false;
                            for(var j =1; j < scope.htmlLevelIds.length; j++){
                                if(scope.htmlLevelIds[j] === scope.selectedItem.itemId){
                                    var index = scope.htmlLevelIds[j-1];
                                }
                            }
                            for(var i =1; i < scope.levelItems.length; i++){
                                if(scope.selectedItem.key === scope.levelItems[i]){
                                    doModify = true;
                                    var temp = scope.levelItems[i-1];
                                    scope.levelItems[i-1] = scope.levelItems[i];
                                    scope.levelItems[i] = temp;
                                    break;
                                }
                            }
                            if(doModify){
                                var modified = JSON.parse(JSON.stringify(scope.parentItem, scope.levelItems));
                                for(var key1 in modified){
                                    for(var key2 in scope.parentItem){
                                        if (key1 === key2){
                                            modified[key1] = scope.parentItem[key2];
                                        }
                                    }
                                }
                                eval(('scope.obj' + scope.selectedItem.path).substring(0, ('scope.obj' + scope.selectedItem.path).lastIndexOf('.')) + " = modified ;");
                                scope.refreshBuffer();
                                scope.buildStructure();
                                scope.selectItem(index);
                            }
                        };

                        scope.moveDown = function(){
                            var doModify = false;
                            var index = 0;
                            for(var j =0; j < scope.htmlLevelIds.length-1; j++){
                                if(scope.htmlLevelIds[j] === scope.selectedItem.itemId){
                                    var nextItemIndex = scope.htmlLevelIds[j+1];
                                }
                            }
                            if(nextItemIndex){
                                var nexItem = scope.buffer[nextItemIndex];
                                var nextItemLength = 0;
                                for(var n = nexItem.itemId; n < scope.buffer.length; n++){
                                    if(scope.buffer[n].path.indexOf(nexItem.path)!== -1){
                                        nextItemLength ++;
                                        continue ;
                                    }
                                    break;
                                }

                                index = scope.selectedItem.itemId + nextItemLength;
                            }

                            for(var i =0; i < scope.levelItems.length-1; i++){
                                if(scope.selectedItem.key === scope.levelItems[i]){
                                    doModify = true;
                                    var temp = scope.levelItems[i+1];
                                    scope.levelItems[i+1] = scope.levelItems[i];
                                    scope.levelItems[i] = temp;
                                    break;
                                }
                            }

                            if(doModify){
                                var modified = JSON.parse(JSON.stringify(scope.parentItem, scope.levelItems));
                                for(var key1 in modified){
                                    for(var key2 in scope.parentItem){
                                        if (key1 === key2){
                                            modified[key1] = scope.parentItem[key2];
                                        }
                                    }
                                }
                                eval(('scope.obj' + scope.selectedItem.path).substring(0, ('scope.obj' + scope.selectedItem.path).lastIndexOf('.')) + " = modified ;");
                                scope.refreshBuffer();
                                scope.buildStructure();
                                scope.selectItem(index);
                            }
                        };

                        scope.confirmRemoveItem = function() {
                            var confirm = $mdDialog.confirm()
                                .title('Are you sure you want to remove this ' + scope.selectedItem.type +'?')
                                .textContent(scope.selectedItem.type +  ' will be removed permanently from the data dictionary.')
                                .ariaLabel('remove property')
                                .targetEvent(ev)
                                .cancel('Cancel')
                                .ok('OK');
                            $mdDialog.show(confirm).then(function() {
                                scope.removeItem();
                            }, function() {
                            });
                        };

                        scope.removeItem = function(){
                            if(scope.selectedItem !== null){
                                var path = "obj" + scope.selectedItem.path;
                                var partials = path.split('.');
                                var deepKey = partials.pop();
                                var deepPath = partials.join('.');
                                var deep = $parse(deepPath);
                                delete deep(scope)[deepKey];
                                scope.refreshBuffer();
                                scope.buildStructure();
                                scope.selectedItem = null;
                            }
                        };

                        scope.addArrayItem = function(){
                            scope.selectedItem.value.push(scope.newArrayItem);
                            scope.arrayValue = scope.newArrayItem;
                            dfxMessaging.showMessage("New element successfully added to array.");
                            scope.refreshBuffer();
                        };

                        scope.removeArrayItem = function(){
                            if(scope.selectedItem.value.length > 0){
                                for(var i = 0;  i < scope.selectedItem.value.length; i++){
                                    if(scope.selectedItem.value[i] === scope.arrayValue){
                                        if(i>0){
                                            scope.arrayValue = scope.selectedItem.value[i-1]
                                            scope.selectedItem.value.splice(i, 1);
                                            scope.refreshBuffer();
                                        }else if(i === 0 && scope.selectedItem.value.length > 1){
                                            scope.arrayValue = scope.selectedItem.value[i+1]
                                            scope.selectedItem.value.splice(0, 1);
                                            scope.refreshBuffer();
                                        }else if(i === 0 && scope.selectedItem.value.length === 1){
                                            scope.selectedItem.value.splice(0, 1);
                                            scope.refreshBuffer();
                                        }
                                        break;
                                    }
                                }
                                scope.newArrayItem = "";
                                dfxMessaging.showMessage("Array element has been successfully deleted.");

                            }
                        };
                    },
                    controller: function() {
                        scope.selectedItem = null;
                            try{
                                scope.obj = JSON.parse(item.content);
                                var obj = JSON.parse(item.content);
                            }catch(e){
                                dfxMessaging.showWarning('JSON string is not valid.');
                                var obj = {};
                            }
                            scope.buffer = [];
                            scope.counter = 0;
                            scope.result = "";
                            scope.iterate(obj, "");
                            $timeout(function(){
                                $('#items-list').html(scope.result);
                                $compile($('#items-list').contents())(scope);
                            },0)

                        scope.defaultType = "String" ;
                        scope.newJsonItem = {
                            itemName:          "newItem",
                            keyName:           "keyName",
                            value:             "value",
                            selectedType:      "String"
                        };
                        scope.keyName = "";

                        scope.closeDialog = function() {
                            $mdDialog.hide();
                        };

                        scope.updateValue = function(){
                                eval("scope.obj" + scope.selectedItem.path + " = scope.selectedItem.value ;");
                                scope.refreshBuffer();
                        };
                    }
                })

            };

            angular.forEach(eventHandlers, function(handler, event) {
                scope.dropzone.on(event, handler);
            });

            scope.processDropzone = function() {
                scope.dropzone.processQueue();
            };

        }
    }
}]);

dfxStudioApp.controller("dfx_studio_deployment_controller", [ '$scope', '$mdDialog', 'dfxDeployment', 'dfxMessaging', '$filter', '$timeout', '$location', function($scope, $mdDialog, dfxDeployment, dfxMessaging, $filter, $timeout, $location) {
    $scope.description = {value : ""};
    $scope.builds = {'web': [], 'mobile': []};
    $scope.application_version = "1.0";
    $scope.build_number = {};

    /*$timeout(function(){
        for(var i =0; i < $scope.applications.length; i++){
            if($scope.applications[i].name === $scope.app_name){
                $scope.application_version = $scope.applications[i].version ;
            }
        }
    },0);*/

    $scope.platform = 0;
    $scope.building_status = 'pending...';
    $scope.new_build = {};
    $scope.host_port = $('body').attr('deploymenturl') ;

    //dfxDeployment.getAppBuilds($scope.app_name).then(function(data){
    //    $scope.platform = data.platform;
    //    $scope.compiler = data.compiler ;
    //});

    $scope.getAppBuilds = function(platform){
        dfxDeployment.getAppBuilds($scope.app_name, platform).then(function(data){
            $scope.builds[platform] = data.items;
            var max = 0;
            for(var i = 0; i < $scope.builds[platform].length; i++){
                $scope.builds[platform][i].logs = [];
                if(parseInt($scope.builds[platform][i].build_number) > max){
                    max = parseInt($scope.builds[platform][i].build_number);
                }
            }

            $scope.build_number[platform] = max;

            if(!$scope.compiler){
                $scope.compiler = data.compiler ;
            }

            dfxDeployment.getDeployedBuilds().then(function(data){
                var builds = data[$scope.app_name];
                for(var key in builds){
                    for(var i =0; i < $scope.builds[platform].length; i++){
                        if(($scope.builds[platform][i].app_version + '.' + $scope.builds[platform][i].build_number) === key){
                            $scope.builds[platform][i].is_deployed = true;
                            $scope.builds[platform][i].link = $scope.host_port + "/deploy/" + $scope.tenant_id + '/' + $scope.app_name + '/' + platform + '/' + key + "/login.html" ;
                        }
                    }
                }
            }, function(err){
                console.log('Seems deployment server doesn\'t respond');
            });
        });
    };

    $scope.getAppBuilds('web');
    $scope.getAppBuilds('mobile');

    $scope.doRebuild = function(build, platform) {
        for(var i =0; i < $scope.builds[platform].length; i++){
            if($scope.builds[platform][i].build_number === build.build_number && $scope.builds[platform][i].app_version === build.app_version){
                $scope.builds[platform][i].status = "pending..." ;
            }
        }
        var removingBuildData = {
            applicationName:    $scope.app_name,
            platform:           platform,
            applicationVersion: build.app_version,
            buildNumber:        build.build_number
        };
        dfxDeployment.deleteBuild(removingBuildData).then(function(data){
            if(build.is_deployed && build.platfrom != 'mobile'){
                dfxDeployment.deleteDeployedBuild($scope.app_name, (build.app_version + "." + build.build_number)).then(function(){
                });
            }
            $scope.doCreateNew(build, platform);
        });
    };

    $scope.doCreateNew = function(new_build, platform){
        var isBuildSaved = false;
        var url = 'http://' + $scope.compiler.host + ':' + $scope.compiler.port + '/compile?server=' + $scope.compiler.serverInfo['server-uuid'] +
            '&tenant=' + $scope.tenant_id +
            '&appid=' + $scope.app_name +
            '&platform=' + new_build.platform +
            '&build=' + $scope.application_version + '.' + new_build.build_number +
            '&schemaId=' + platform +
            '&deployto=29cd8260-e168-11e4-905f-e91235c968e0';

        dfxDeployment.runCompilerTask(url).then(function(){
            /*if(!$scope.compilerSocket){*/
            try {
                $scope.compilerSocket = io(
                    'http://' + $scope.compiler.host + ':' + $scope.compiler.port + '/' +
                    $scope.compiler.serverInfo['server-uuid'] + '_' + $scope.tenant_id,
                    {
                        'force new connection': true
                    }
                );
            } catch(err) {
                /*console.log(err);*/
            }
            /*}*/


            $scope.compilerSocket.on('status', function (data) {
                var newBuildDataForSockets = new_build;
                $scope.description = {value : ""};

                var m = data.message,
                    s = JSON.parse(m.text);

                if (s.done == s.total) {
                    newBuildDataForSockets.error = parseInt(s.errors) != 0;
                    if (!isBuildSaved) {
                        isBuildSaved = true;
                        dfxDeployment.registerNewBuild(newBuildDataForSockets, $scope.app_name, platform).then(function (res) {
                            $scope.getAppBuilds(platform);
                        });
                    }
                }
            });

            $scope.compilerSocket.on('missedStatus', function (list) {
                var newBuildDataForSockets = new_build;
                $scope.description = {value : ""};

                var log = list.log;
                var m   = log[log.length - 1],
                    s   = JSON.parse(m.text);

                if (s.done == s.total) {
                    newBuildDataForSockets.error = parseInt(s.errors) != 0;
                    if (!isBuildSaved) {
                        isBuildSaved = true;
                        dfxDeployment.registerNewBuild(newBuildDataForSockets, $scope.app_name, platform).then(function (res) {
                            $scope.getAppBuilds(platform);
                        });
                    }
                }
            });

            $scope.compilerSocket.on('update', function (data) {
                for(var i = 0; i < $scope.builds[platform].length; i++){
                    if($scope.builds[platform][i].build === data.message.build) {
                        $scope.builds[platform][i].logs.push(data.message);
                    }
                }
            });

        },function(err){
            dfxMessaging.showWarning("Seems compiler not reachable!");
            $scope.getAppBuilds('web');
            $scope.getAppBuilds('mobile');
        })
    };

    $scope.buildDialog = function(ev, platform) {
        $mdDialog.show({
            scope: $scope.$new(),
            controller: DialogController,
            templateUrl: 'studioviews/create_build_dialog.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:true
        }).then(function() {
            var alert = null;
            if ($scope.description.value.indexOf(" ") != -1) {
                alert = "The name cannot have empty spaces";
            }
            else if ($.isEmptyObject($scope.description.value)) {
                alert = "The name cannot be empty";
            }
            else if (!/^[a-zA-Z0-9-_.]+$/.test($scope.description.value)) {
                alert = "The name can have only letters, numbers, underscore or dash symbols";
            }
            if (alert) {
                dfxMessaging.showWarning(alert);
            } else {
                $scope.build_number[platform] = $scope.build_number[platform] + 1;
                $scope.new_build = {
                    application:        $scope.app_name,
                    platform:           platform,
                    app_version:        $scope.application_version,
                    build_number:       "" +  $scope.build_number[platform],
                    build:              ($scope.application_version + '.' + $scope.build_number),
                    deployed:           false,
                    description:        $scope.description.value,
                    release_notes:      "",
                    build_date:          $filter('date')(new Date(), 'EEE MMM dd yyyy HH:mm:ss') + ' GMT' + $filter('date')(new Date(), 'Z'),
                    displayLog:          false,
                    logs:               [],
                    status:             'pending...'
                }
                $scope.builds[platform].push($scope.new_build);
                $scope.doCreateNew($scope.new_build, platform);

            }

        }, function() {
            // if cancel
        });

        function DialogController($scope, $mdDialog) {
            $scope.hide = function() {
                $mdDialog.hide();
            };
            $scope.cancel = function() {
                $mdDialog.cancel();
            };
        }
    };

    $scope.confirmDelete = function(ev, build, platform, index) {
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want to remove this build?')
            .textContent('Build will be removed permanently from the repository.')
            .ariaLabel('remove build')
            .targetEvent(ev)
            .cancel('Cancel')
            .ok('OK');
        $mdDialog.show(confirm).then(function() {
            $scope.deleteBuild(build, platform, index);
        }, function() {
        });
    };

    $scope.deleteBuild = function(build, platform, index){
        var removingBuildData = {
            applicationName:    $scope.app_name,
            platform:           platform,
            applicationVersion: build.app_version,
            buildNumber:        build.build_number
        };
        dfxDeployment.deleteBuild(removingBuildData).then(function(data){
            $scope.builds[platform].splice(index, 1);
            $scope.getAppBuilds(platform);
            $scope.description = {value : ""};
            dfxMessaging.showMessage('Build data has been successfully deleted.');
            if(build.is_deployed){
                $scope.deleteDeployedBuild(build.app_version + "." + build.build_number);
            }
        });
    };

    $scope.showBuildLog = function(build, platform, buildindex){
        if(build.status !== 'pending'){
            if(build.displayLog){
                build.displayLog = false;
            }else{
                var body = {
                    tenant:             $scope.tenant_id,
                    applicationName:    $scope.app_name,
                    platform:           platform,
                    applicationVersion: build.app_version,
                    buildNumber:        build.build_number,
                    file:               $scope.compiler.logFile
                };
                dfxDeployment.getLogFile(body).then(function(data){
                    var infoLines = data.match(/[^\r\n]+/g);
                    infoLines.forEach(function (infoLine, index) {
                        if (index > 0) {
                            var infoDetails    = infoLine.split('%%');
                            $scope.builds[platform][buildindex].logs.push({level: infoDetails[0], text: infoDetails[2], appid: $scope.app_name}) ;
                        }
                    });
                });
                build.displayLog = true;
            }
        }
    };

    $scope.deleteDeployedBuild = function(build_version){
        dfxDeployment.deleteDeployedBuild($scope.app_name, build_version).then(function(){
            dfxMessaging.showMessage('Build data has been successfully deleted from deployment server.');
        }, function(){
            dfxMessaging.showWarning('Build data has not been deleted from deployment server') ;
        });
    };

    $scope.deployBuild = function(build, platform){
        setWaitingMessageValue(build, true);
        var body = {
            applicationName:        $scope.app_name,
            platform:               platform,
            applicationVersion:     build.app_version,
            buildNumber:            build.build_number,
            tenantId:               $scope.tenant_id
        };
        dfxDeployment.deployBuild(body).then(function(data){
            setWaitingMessageValue(build, false);
            dfxMessaging.showMessage('Build has been successfully deployed on deployment server.');
            $scope.getAppBuilds(platform);
        },function (err) {
            setWaitingMessageValue(build, false);
            dfxMessaging.showWarning('Build has been failed.');
        });
    };

    function setWaitingMessageValue(build, value) {
        $scope.builds[build.platform].forEach(function(b, index){
            if (build._id === b._id) {
                $scope.builds[build.platform][index].waitingMessage = value;
            }
        });
    }

    $scope.getDeployedQRCode = function(build) {
        dfxDeployment.getMobileApp(build).then( function(response) {
            console.log(response.data.referrer);
        });
    };

    $scope.navToCloud = function(ev) {
        $location.path( "/platform/cloud" );
    };
}]);

dfxStudioApp.controller("dfx_studio_view_controller", [ '$scope', '$routeParams', '$mdDialog', '$location', '$window', 'dfxMessaging', 'dfxViews', function($scope, $routeParams, $mdDialog, $location, $window, dfxMessaging, dfxViews) {
    $scope.app_name = $routeParams.appname;
    $scope.view_name = $routeParams.viewname;
    $scope.view_platform = $routeParams.platform;
    $scope.view = {};

    dfxViews.getOne( $scope, $scope.app_name, $scope.view_name, $scope.view_platform ).then( function(data) {
        $scope.view = data;
    });

    dfxViews.getCategories( $scope, $scope.app_name, $scope.view_platform ).then(function( data ) {
        $scope.app_categories = data.data[$scope.view_platform];
    });

    $scope.openViewDesigner = function() {
        window.localStorage.removeItem('pagePreviewName');
        $window.open( '/studio/widget/' + $scope.view_platform + '/' + $scope.app_name + '/' + $scope.view_name + '/index.html', '_blank' );
    };

    $scope.update = function() {
        dfxViews.update( $scope, $scope.view ).then(function( data ) {
            dfxMessaging.showMessage(data.data);
            $scope.getAll();
        });
    }

    $scope.delete = function(ev) {
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want delete this view?')
            .textContent('The view will be removed permanently from the repository.')
            .ariaLabel('delete view')
            .targetEvent(ev)
            .cancel('Cancel')
            .ok('OK');
        $mdDialog.show(confirm).then(function() {
            dfxViews.delete( $scope, $scope.view ).then( function(data) {
                dfxMessaging.showMessage( 'The view has been deleted' );
                $scope.getAll();
                $location.path('/home');
            });
        }, function() {
        });
    };

    $scope.cancel = function( ev ) {
        var confirm = $mdDialog.confirm()
            .title('Are you sure to exit the View Editor?')
            .textContent('All changes will be lost.')
            .ariaLabel('leave Page')
            .targetEvent(ev)
            .cancel('Cancel')
            .ok('OK');
        $mdDialog.show(confirm).then(function() {
            $scope.getAll();
            $location.path('/home');
        }, function() {
        });
    };

}]);

dfxStudioApp.controller("dfx_studio_view_create_controller", [ '$scope', '$routeParams', '$mdDialog', '$location', '$window', 'dfxMessaging', 'dfxViews', 'dfxApplications', function($scope, $routeParams, $mdDialog, $location, $window, dfxMessaging, dfxViews, dfxApplications) {
    $scope.view = {
        "name": "NewView",
        "application": $routeParams.appname,
        "description": "",
        "wtype": "visual",
        "platform": $routeParams.platform,
        "category": "Default",
        "src": JSON.stringify({
            "properties": {},
            "definition": {
                "default": [
                    {
                        id: Math.floor(Math.random() * 1000),
                        type: "panel",
                        attributes: {
                            "name": { "value": "pnlPanel1", "status": "overridden" }
                        },
                        children:   []
                    }
                ]
            }
        }),
        "src_styles": ""
    };

    var sufix = '';
    for(var i = 0;  i < 3; i++) {
        sufix += Math.floor(Math.random() * 10);
    }
    $scope.view.name += sufix;

    dfxApplications.getUserInfo().then(function(data){
        $scope.view.owner = data.login ;
    });

    if ( $routeParams.categoryname ) {
        $scope.view.category = $routeParams.categoryname;
    }

    dfxViews.getCategories( $scope, $routeParams.appname, $routeParams.platform ).then(function( data ) {
        $scope.app_categories = data.data[$scope.view.platform];
    });

    $scope.save = function() {
        if ( /^[-a-zA-Z0-9_]+$/.test( $scope.view.name ) ) {
            dfxViews.create( $scope, $scope.view ).then( function(data) {
                dfxMessaging.showMessage('The view has been successfully created');
                $scope.getAll();
                $location.path('/view/update/'+ $scope.view.application + '/' + $scope.view.platform + '/' + $scope.view.name);
            }, function( data ) {
                dfxMessaging.showWarning( data.data.error.message );
            });
        } else {
            dfxMessaging.showWarning('Not valid View Name'); 
            $("#view-name").focus();
        }
    };

    $scope.cancel = function(ev) {
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want cancel?')
            .textContent('The view won\'t be created.')
            .ariaLabel('cancel add view')
            .targetEvent(ev)
            .cancel('Cancel')
            .ok('OK');
        $mdDialog.show(confirm).then(function() {
            $scope.getAll();
            $location.path('/home');
        }, function() {
        });
    };

}]);

dfxStudioApp.controller("dfx_studio_view_category_controller", [ '$scope', '$routeParams', '$location', '$mdSidenav', '$mdDialog', '$timeout', 'dfxMessaging', 'dfxApplications', 'dfxAuthProviders', 'dfxViews', function( $scope, $routeParams, $location, $mdSidenav, $mdDialog, $timeout, dfxMessaging, dfxApplications, dfxAuthProviders, dfxViews) {
    $scope.app_name = $routeParams.app_name;
    $scope.view_platform = $routeParams.platform;

    dfxViews.getCategories( $scope, $scope.app_name, $scope.view_platform ).then(function( data ) {
        $scope.app_categories = [];
        for ( var i = 0; i < data.data[$scope.view_platform].length; i++ ) {
            $scope.app_categories.push(data.data[$scope.view_platform][i]);
        }
    });

    var bodyHeight = parseFloat($("body").css('height'));
    $timeout(function() {
        var scopeSourceTable = document.getElementById('scope-source-table');
        $(scopeSourceTable).css('max-height', bodyHeight-260);
    }, 0);

    $scope.addCategoryBtn = function() {
        $scope.scopeCategory = {};
        $scope.categoryMode = 'addCategory';
        var sideNavInstance = $mdSidenav('side_nav_view_category');
        sideNavInstance.toggle();
    }

    $scope.createCategory = function() {
        var regexp = /([a-z0-9_])(\w*)/gi;
        res = regexp.exec( $scope.scopeCategory.name );
        if ( res && $scope.scopeCategory.name && $scope.scopeCategory.name !== '' ) {
            dfxViews.createCategory( $scope, $scope.scopeCategory.name, $scope.app_name, $scope.view_platform ).then(function( data ) {
                if ( data.status && data.status === 200 && data.data.data !== 'Current category name already exists' ) {
                    dfxMessaging.showMessage(data.data.data);
                    $scope.app_categories = [];
                    dfxViews.getCategories( $scope, $scope.app_name, $scope.view_platform ).then(function( data ) {
                        for ( var i = 0; i < data.data[$scope.view_platform].length; i++ ) {
                            $scope.app_categories.push(data.data[$scope.view_platform][i]);
                        }
                        $scope.getAll();
                    });
                    var sideNavInstance = $mdSidenav('side_nav_view_category');
                    sideNavInstance.toggle();
                } else {
                    dfxMessaging.showWarning(data.data.data);
                }
            });
        } else {
            dfxMessaging.showWarning('Not valid Category Name');
        }
    }

    $scope.editCategoryBtn = function( category ) {
        $scope.categoryMode = 'editCategory';
        $scope.scopeCategory = category;
        $scope.toEdit = {};
        var sideNavInstance = $mdSidenav('side_nav_view_category');
        sideNavInstance.toggle();
    }

    $scope.editCategory = function( edited ) {
        var newName = edited.name;
        var regexp = /([a-z0-9_])(\w*)/gi;
        res = regexp.exec( newName );
        if ( res && newName && newName !== $scope.scopeCategory.name && newName !== '' ) {
            dfxViews.editCategory( $scope, $scope.scopeCategory.name, newName, $scope.app_name, $scope.view_platform ).then(function( data ) {
                if ( data.data.data !== 'Current category name already exists!' ) {
                    dfxMessaging.showMessage(data.data.data);
                    $scope.app_categories = [];
                    dfxViews.getCategories( $scope, $scope.app_name, $scope.view_platform ).then(function( data ) {
                        for ( var i = 0; i < data.data[$scope.view_platform].length; i++ ) {
                            $scope.app_categories.push(data.data[$scope.view_platform][i]);
                        }
                        $scope.getAll();
                    });
                    var sideNavInstance = $mdSidenav('side_nav_view_category');
                    sideNavInstance.toggle();
                } else {
                    dfxMessaging.showWarning(data.data.data);
                }
            });
        } else if ( newName === $scope.scopeCategory.name ) {
            dfxMessaging.showWarning('Category with such name already exist!');
            
        } else {
            dfxMessaging.showWarning('Not valid Category Name');
        }
    }

    $scope.deleteCategory = function( category_name ) {
        dfxViews.removeCategory( $scope, category_name, $scope.app_name, $scope.view_platform ).then(function( data ) {
            if ( data.status && data.status === 200 ) {
                dfxMessaging.showMessage(data.data.data);
                $scope.app_categories = [];
                dfxViews.getCategories( $scope, $scope.app_name, $scope.view_platform ).then(function( data ) {
                    for ( var i = 0; i < data.data[$scope.view_platform].length; i++ ) {
                        $scope.app_categories.push(data.data[$scope.view_platform][i]);
                    }
                    $scope.getAll();
                });
            } else {
                dfxMessaging.showWarning(data.data.data);
            }
        });
    }

    $scope.confirmDelete = function( ev, category_name ) {
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want to remove this category?')
            .textContent('Category will be removed from the repository.')
            .ariaLabel('remove service')
            .targetEvent(ev)
            .cancel('Cancel')
            .ok('OK');
        $mdDialog.show(confirm).then(function() {
            $scope.deleteCategory( category_name );
        }, function() {
        });
    };

    $scope.closeSidenav = function() {
        var sideNavInstance = $mdSidenav('side_nav_view_category');
        sideNavInstance.toggle();
    }
}]);

dfxStudioApp.controller("dfx_studio_page_controller", [ '$scope', '$routeParams', '$mdDialog', '$location', '$window', 'dfxMessaging', 'dfxPages', function($scope, $routeParams, $mdDialog, $location, $window, dfxMessaging, dfxPages) {
    $scope.app_name = $routeParams.appname;
    $scope.page_platform = $routeParams.platform;
    $scope.page_name = $routeParams.pagename;
    $scope.page = {};

    dfxPages.getCategories( $scope, $routeParams.appname, $scope.page_platform ).then(function( data ) {
        $scope.app_categories = data.data[$scope.page_platform];
    });

    dfxPages.getOne( $scope, $scope.app_name, $scope.page_name, $scope.page_platform ).then( function(data) {
        $scope.page = data;
    });

    $scope.openPageDesigner = function() {
        $window.open( '/studio/screen/' + $scope.app_name + '/' + $scope.page_platform + '/' + $scope.page_name + '/index.html', '_blank' );
    };

    $scope.update = function() {
        dfxPages.update( $scope, $scope.page ).then( function(data) {
            dfxMessaging.showMessage(data.data);
            $scope.getAll();
        });
    }

    $scope.delete = function(ev) {
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want delete this page?')
            .textContent('The page will be removed permanently from the repository.')
            .ariaLabel('delete page')
            .targetEvent(ev)
            .cancel('Cancel')
            .ok('OK');
        $mdDialog.show(confirm).then(function() {
            dfxPages.delete( $scope, $scope.page ).then( function(data) {
                dfxMessaging.showMessage( 'The page has been deleted' );
                $scope.getAll();
                $location.path('/home');
            });
        }, function() {
        });
    };

    $scope.cancel = function( ev ) {
        var confirm = $mdDialog.confirm()
            .title('Are you sure to exit the Page Editor?')
            .textContent('All changes will be lost.')
            .ariaLabel('leave Page')
            .targetEvent(ev)
            .cancel('Cancel')
            .ok('OK');
        $mdDialog.show(confirm).then(function() {
            $scope.getAll();
            $location.path('/home');
        }, function() {
        });
    };

}]);

dfxStudioApp.controller("dfx_studio_page_create_controller", [ '$scope', '$routeParams', '$mdDialog', '$location', '$window', 'dfxMessaging', 'dfxPages', function($scope, $routeParams, $mdDialog, $location, $window, dfxMessaging, dfxPages) {
    $scope.page = {
        "name": "NewPage",
        "application": $routeParams.appname,
        "title": "",
        "visibility": "visible",
        "platform" : "web",
        "template": "basic",
        "category": "Default",
        "script": "dfxAppRuntime.controller('dfx_page_controller', [ '$scope', '$rootScope', function( $scope, $rootScope) {\n\t// Insert your code here\n}]);",
        "layout": {
            "rows" : [ { "height" : "100", "autoHeight": false, "columns" : [ {"width" : "100", "views" : []} ] } ]
        }
    };

    var sufix = '';
    for(var i = 0;  i < 3; i++) {
        sufix += Math.floor(Math.random() * 10);
    }
    $scope.page.name += sufix;

    if ( $routeParams.categoryname ) {
        $scope.page.category = $routeParams.categoryname;
    }

    if ( $routeParams.platform ) {
        $scope.page.platform = $routeParams.platform;
    }

    dfxPages.getCategories( $scope, $routeParams.appname, $scope.page.platform ).then(function( data ) {
        $scope.app_categories = data.data[$scope.page.platform];
    });

    //if (!$scope.platform) {
    //    $scope.page.platform = 'web';
    //    $scope.platformDisabled = false;
    //} else {
    //    $scope.page.platform = $scope.platform;
    //    $scope.platformDisabled = true;
    //}

    $scope.save = function() {
        if ( /^[-a-zA-Z0-9_]+$/.test( $scope.page.name ) ) {
            switch($scope.page.platform) {
                case 'Desktop' : $scope.page.platform = 'web'; break;
                case 'Tablet' : $scope.page.platform = 'tablet'; break;
                case 'Mobile' : $scope.page.platform = 'mobile'; break;
            }
            dfxPages.create( $scope, $scope.page ).then( function(data) {
                dfxMessaging.showMessage('The page has been successfully created');
                $scope.getAll();
                $location.path('/page/update/'+ $scope.page.application + '/' + $scope.page.platform + '/' + $scope.page.name);
            }, function( data ) {
                dfxMessaging.showWarning( data.data.error.message );
            });
        } else {
            dfxMessaging.showWarning('Not valid Page Name'); 
            $("#page-name").focus();
        }
    };

    $scope.cancel = function(ev) {
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want cancel?')
            .textContent('The page won\'t be created.')
            .ariaLabel('cancel add page')
            .targetEvent(ev)
            .cancel('Cancel')
            .ok('OK');
        $mdDialog.show(confirm).then(function() {
            $scope.getAll();
            $location.path('/home');
        }, function() {
        });
    };

}]);

dfxStudioApp.controller("dfx_studio_page_category_controller", [ '$scope', '$routeParams', '$location', '$mdSidenav', '$mdDialog', '$timeout', 'dfxMessaging', 'dfxApplications', 'dfxAuthProviders', 'dfxPages', function( $scope, $routeParams, $location, $mdSidenav, $mdDialog, $timeout, dfxMessaging, dfxApplications, dfxAuthProviders, dfxPages) {
    $scope.app_name = $routeParams.app_name;
    $scope.page_platform = $routeParams.platform;

    dfxPages.getCategories( $scope, $scope.app_name, $scope.page_platform ).then(function( data ) {
        $scope.app_categories = [];
        for ( var i = 0; i < data.data[$scope.page_platform].length; i++ ) {
            $scope.app_categories.push(data.data[$scope.page_platform][i]);
        }
    });

    var bodyHeight = parseFloat($("body").css('height'));
    $timeout(function() {
        var scopeSourceTable = document.getElementById('scope-source-table');
        $(scopeSourceTable).css('max-height', bodyHeight-260);
    }, 0);

    $scope.addCategoryBtn = function() {
        $scope.scopeCategory = {};
        $scope.categoryMode = 'addCategory';
        var sideNavInstance = $mdSidenav('side_nav_page_category');
        sideNavInstance.toggle();
    }

    $scope.createCategory = function() {
        var regexp = /([a-z0-9_])(\w*)/gi;
        res = regexp.exec( $scope.scopeCategory.name );
        if ( res && $scope.scopeCategory.name && $scope.scopeCategory.name !== '' ) {
            dfxPages.createCategory( $scope, $scope.scopeCategory.name, $scope.app_name, $scope.page_platform ).then(function( data ) {
                if ( data.status && data.status === 200 && data.data.data !== 'Screens category with same name already exists!' ) {
                    dfxMessaging.showMessage(data.data.data);
                    $scope.app_categories = [];
                    dfxPages.getCategories( $scope, $scope.app_name, $scope.page_platform ).then(function( data ) {
                        for ( var i = 0; i < data.data[$scope.page_platform].length; i++ ) {
                            $scope.app_categories.push(data.data[$scope.page_platform][i]);
                        }
                        $scope.getAll();
                    });
                    var sideNavInstance = $mdSidenav('side_nav_page_category');
                    sideNavInstance.toggle();
                } else {
                    dfxMessaging.showWarning('Current Category Name already exists!');
                }
            });
        } else {
            dfxMessaging.showWarning('Not valid Category Name');
        }
    }

    $scope.editCategoryBtn = function( category ) {
        $scope.categoryMode = 'editCategory';
        $scope.scopeCategory = category;
        $scope.toEdit = {};
        var sideNavInstance = $mdSidenav('side_nav_page_category');
        sideNavInstance.toggle();
    }

    $scope.editCategory = function( edited ) {
        var newName = edited.name;
        var regexp = /([a-z0-9_])(\w*)/gi;
        res = regexp.exec( newName );
        if ( res && newName && newName !== $scope.scopeCategory.name && newName !== '' ) {
            dfxPages.editCategory( $scope, $scope.scopeCategory.name, newName, $scope.app_name, $scope.cat_platform ).then(function( data ) {
                if ( data.data.data !== 'Current category name already exists!' ) {
                    dfxMessaging.showMessage(data.data.data);
                    $scope.app_categories = [];
                    dfxPages.getCategories( $scope, $scope.app_name, $scope.page_platform ).then(function( data ) {
                        for ( var i = 0; i < data.data[$scope.page_platform].length; i++ ) {
                            $scope.app_categories.push(data.data[$scope.page_platform][i]);
                        }
                        $scope.getAll();
                    });
                    var sideNavInstance = $mdSidenav('side_nav_page_category');
                    sideNavInstance.toggle();
                } else {
                    dfxMessaging.showWarning(data.data.data);
                }
            });
        } else if ( newName === $scope.scopeCategory.name ) {
            dfxMessaging.showWarning('Category with such name already exist!');
            
        } else {
            dfxMessaging.showWarning('Not valid Category Name');
        }
    }

    $scope.deleteCategory = function( category_name ) {
        dfxPages.removeCategory( $scope, category_name, $scope.app_name, $scope.page_platform ).then(function( data ) {
            if ( data.status && data.status === 200 ) {
                dfxMessaging.showMessage(data.data.data);
                $scope.app_categories = [];
                dfxPages.getCategories( $scope, $scope.app_name, $scope.page_platform ).then(function( data ) {
                    for ( var i = 0; i < data.data[$scope.page_platform].length; i++ ) {
                        $scope.app_categories.push(data.data[$scope.page_platform][i]);
                    }
                    $scope.getAll();
                });
            } else {
                dfxMessaging.showWarning(data.data.data);
            }
        });
    }

    $scope.confirmDelete = function( ev, category_name ) {
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want to remove this category?')
            .textContent('Category will be removed from the repository.')
            .ariaLabel('remove service')
            .targetEvent(ev)
            .cancel('Cancel')
            .ok('OK');
        $mdDialog.show(confirm).then(function() {
            $scope.deleteCategory( category_name );
        }, function() {
        });
    };

    $scope.closeSidenav = function() {
        var sideNavInstance = $mdSidenav('side_nav_page_category');
        sideNavInstance.toggle();
    }
}]);

dfxStudioApp.controller("dfx_studio_settings_controller", [ '$scope', function($scope) {

}]);

dfxStudioApp.controller("dfx_studio_app_roles_controller", [ '$scope', '$routeParams', '$mdDialog', '$mdSidenav', 'dfxAppRoles', 'dfxMessaging',
    function($scope, $routeParams, $mdDialog, $mdSidenav, dfxAppRoles, dfxMessaging)
{
    var parentScope = $scope.$parent.$parent;
    parentScope.app_roles = $scope;

    $scope.app_name = $routeParams.appname;

    dfxAppRoles.getAll($scope, $scope.app_name).then(function (data) {
        $scope.app_roles = data;
    });

    $scope.initNewRole = function() {
        dfxAppRoles.getAllRights($scope, $scope.app_name).then(function (rights) {
            $scope.operation = 'create';
            if ($scope.app_users) $scope.app_users.operation = '';

            $scope.new_app_role = {'name': '', 'description': ''};
            $scope.all_rights = rights;

            var sideNavInstance = $mdSidenav('side_nav_left');
            sideNavInstance.toggle();
        });
    };

    $scope.create = function() {
        var rights = $scope.all_rights.map(function(right) {
            return right.isChecked
                ? 'DATAQUERY::' + right.name
                : null;
        }).filter(function (right) {
            return right ? true : false;
        });

        var to_update = {
            name:        $scope.new_app_role.name,
            app_name:    $scope.app_name,
            rights:      rights,
            description: $scope.new_app_role.description
        };

        dfxAppRoles.create($scope, to_update).then(function success() {
            var sideNavInstance = $mdSidenav('side_nav_left');
            $scope.app_roles.push($scope.new_app_role);
            sideNavInstance.toggle();

            //update role because rights are not added when creating role
            dfxAppRoles.update($scope, to_update).then(function () {
                dfxMessaging.showMessage('Role successfully created.');
            });
        }, function fail() {
            dfxMessaging.showWarning('This role already exists.');
        });
    };

    $scope.edit = function(role_name) {
        dfxAppRoles.edit($scope, $scope.app_name, role_name).then(function (role) {
            $scope.operation = 'update';
            if ($scope.app_users) $scope.app_users.operation = '';

            $scope.current_app_role = role;
            $scope.all_rights = role.all_dataqueries.map(function(dataquery) {
                return role.rights.data.indexOf('DATAQUERY::' + dataquery.name) > -1
                    ? {'isChecked': true, 'name': dataquery.name}
                    : {'isChecked': false, 'name': dataquery.name};
            });

            var sideNavInstance = $mdSidenav('side_nav_left');
            sideNavInstance.toggle();
        });
    };

    $scope.update = function() {
        var rights = $scope.all_rights.map(function(right) {
            return right.isChecked
                ? 'DATAQUERY::' + right.name
                : null;
        }).filter(function (right) {
            return right ? true : false;
        });

        var to_update = {
            name:        $scope.current_app_role.data.name,
            app_name:    $scope.app_name,
            rights:      rights,
            description: $scope.current_app_role.data.description
        };

        dfxAppRoles.update($scope, to_update).then(function () {
            for (var i = 0; i < $scope.app_roles.length; i++) {
                if ($scope.app_roles[i].name === $scope.current_app_role.data.name) {
                    $scope.app_roles[i] = $scope.current_app_role.data;
                    break;
                }
            }
            var sideNavInstance = $mdSidenav('side_nav_left');
            sideNavInstance.toggle();
            dfxMessaging.showMessage('Role successfully updated.');
        });
    };

    $scope.delete = function(role_name) {
        dfxAppRoles.delete($scope, $scope.app_name, role_name).then(function () {
            for (var i = 0; i < $scope.app_roles.length; i++) {
                if ($scope.app_roles[i].name === role_name){
                    $scope.app_roles.splice(i, 1);
                    break;
                }
            }
        });
    };

    $scope.closeSidenav = function(){
        var sideNavInstance = $mdSidenav('side_nav_left');
        sideNavInstance.toggle();
    };

    $scope.confirmDelete = function(ev, role) {
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want to remove this role?')
            .textContent('Role will be removed from repository.')
            .ariaLabel('remove role')
            .targetEvent(ev)
            .cancel('Cancel')
            .ok('OK');
        $mdDialog.show(confirm).then(function() {
            $scope.delete(role.name);
        }, function() {
        });
    };
}]);

dfxStudioApp.controller("dfx_studio_app_users_controller", [ '$scope', '$compile', '$routeParams', '$mdSidenav', '$mdDialog', 'dfxMessaging', 'dfxAppUsers', 'dfxUserDefinition',
    function($scope, $compile, $routeParams, $mdSidenav, $mdDialog, dfxMessaging, dfxAppUsers, dfxUserDefinition)
{
    var parentScope = $scope.$parent.$parent;
    parentScope.app_users = $scope;

    $scope.app_name = $routeParams.appname;

    dfxAppUsers.getAll( $scope, $scope.app_name ).then(function ( data ) {
        $scope.users = data;
    });

    $scope.changePass = function() {
        $scope.current_app_user.pass_changed = true;
    };

    $scope.showPassMessage = function(user) {
        user.show_pass_message = true;
    };

    $scope.initNewUser = function() {
        dfxAppUsers.getAllRoles($scope, $scope.app_name).then(function (roles) {
            $scope.operation = 'create';
            if ($scope.app_roles) $scope.app_roles.operation = '';

            $scope.new_app_user = {'login': '', 'firstName': '', 'lastName': '', 'email': '', 'new_pass': ''};
            $scope.new_app_user.all_roles = roles;

            // check guest role by default
            $scope.new_app_user.default_role_updated = 'guest';
            $scope.app_users.new_app_user.roles_updated = {'guest': true};

            var sideNavInstance = $mdSidenav('side_nav_left');
            sideNavInstance.toggle().then(function () {
                // properties from user definition
                dfxUserDefinition.getUserDefinition($scope, $scope.app_name).then(function (user_def) {
                    $scope.user_definition = user_def;
                    addTree($scope.user_definition);
                });
            });
        });
    };

    $scope.create = function() {
        var to_create = {
            login:     $scope.new_app_user.login,
            app_name:  $scope.app_name,
            firstName: $scope.new_app_user.firstName,
            lastName:  $scope.new_app_user.lastName,
            email:     $scope.new_app_user.email,
            new_pass:  $scope.new_app_user.new_pass,
            roles:     {
                default: $scope.new_app_user.default_role_updated,
                list:    []
            }
        };

        // collect user roles
        if ($scope.app_users.new_app_user.roles_updated) {
            var props = Object.keys($scope.app_users.new_app_user.roles_updated);
            for (var i = 0; i < props.length; i++) {
                if ($scope.app_users.new_app_user.roles_updated[ props[i] ] == true) {
                    to_create.roles.list.push(props[i]);
                }
            }
        }

        var additionalProperties = {};
        collectAdditionalProperties($scope.user_definition, additionalProperties);
        to_create.properties = additionalProperties;

        dfxAppUsers.create($scope, to_create).then(function (user) {
            // update created user to store additional properties - to avoid re-write engine
            dfxAppUsers.update($scope, to_create).then(function () {
                $scope.users.push({
                    credentials: {login: user.login},
                    name: {first: user.firstName, last: user.lastName}
                });
                var sideNavInstance = $mdSidenav('side_nav_left');
                sideNavInstance.toggle();
                dfxMessaging.showMessage('User successfully created.');
            });
        }, function fail(response) {
            dfxMessaging.showWarning(response.data.data);
        });
    };

    $scope.edit = function(user_login) {
        dfxAppUsers.edit($scope, $scope.app_name, user_login).then(function (user) {
            $scope.operation = 'update';
            if ($scope.app_roles) $scope.app_roles.operation = '';

            $scope.current_app_user = user;
            $scope.current_app_user.roles_updated = {};

            $scope.current_app_user.pass_changed = false;
            $scope.current_app_user.new_pass = "newpass";
            $scope.current_app_user.repeat_pass = "";
            $scope.current_app_user.pass_matching = false;
            $scope.current_app_user.show_pass_message = false;

            // show which roles are checked (checkboxes) and which is main (radio)
            $scope.current_app_user.default_role_updated = $scope.current_app_user.roles.default;

            for (var i = 0; i < $scope.current_app_user.roles.list.length; i++) {
                var nextCheckedRole = $scope.current_app_user.roles.list[i];
                $scope.app_users.current_app_user.roles_updated[nextCheckedRole] = true;
            }

            var sideNavInstance = $mdSidenav('side_nav_left');
            sideNavInstance.toggle().then(function () {
                // properties from user definition
                $scope.user_definition = user.user_def;
                addTree($scope.user_definition);
            });
        });
    };

    $scope.update = function() {
        var to_update = {
            login:     $scope.current_app_user.login,
            app_name:  $scope.app_name,
            firstName: $scope.current_app_user.firstName,
            lastName:  $scope.current_app_user.lastName,
            email:     $scope.current_app_user.email,
            roles:     {
                default: $scope.current_app_user.default_role_updated,
                list:    []
            }
        };

        // collect user roles
        if ($scope.app_users.current_app_user.roles_updated) {
            var props = Object.keys($scope.app_users.current_app_user.roles_updated);
            for (var i = 0; i < props.length; i++) {
                if ($scope.app_users.current_app_user.roles_updated[ props[i] ] == true) {
                    to_update.roles.list.push(props[i]);
                }
            }
        }

        var additionalProperties = {};
        collectAdditionalProperties($scope.user_definition, additionalProperties);
        to_update.properties = additionalProperties;

        dfxAppUsers.update($scope, to_update, $scope.current_app_user.new_pass, $scope.current_app_user.pass_changed).then(function () {
            for (var i = 0; i < $scope.users.length; i++) {
                if ($scope.users[i].credentials.login === $scope.current_app_user.login) {
                    $scope.users[i].name.first = $scope.current_app_user.firstName;
                    $scope.users[i].name.last = $scope.current_app_user.lastName;
                    break;
                }
            }
            var sideNavInstance = $mdSidenav('side_nav_left');
            sideNavInstance.toggle();
            dfxMessaging.showMessage('User successfully updated.');
        });
    };

    $scope.delete = function(user_login) {
        dfxAppUsers.delete($scope, $scope.app_name, user_login).then(function () {
            for (var i = 0; i < $scope.users.length; i++) {
                if ($scope.users[i].credentials.login === user_login){
                    $scope.users.splice(i, 1);
                    break;
                }
            }
        });
    };

    $scope.confirmDelete = function(ev, user_login) {
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want to remove this user?')
            .textContent('User will be removed from repository.')
            .ariaLabel('remove user')
            .targetEvent(ev)
            .cancel('Cancel')
            .ok('OK');
        $mdDialog.show(confirm).then(function() {
            $scope.delete(user_login);
        }, function() {
        });
    };

    $scope.closeSidenav = function(){
        var sideNavInstance = $mdSidenav('side_nav_left');
        sideNavInstance.toggle();
    };

    $scope.$watch("new_app_user.repeat_pass", function(newValue) {
        if (newValue) {
            if (newValue===$scope.new_app_user.new_pass) {
                $scope.new_app_user.pass_matching = true;
            }else{
                $scope.new_app_user.pass_matching = false;
            }
        }
    });

    $scope.$watch("new_app_user.default_role_updated", function(newValue) {
        if (newValue) {
            $scope.app_users.new_app_user.roles_updated = $scope.app_users.new_app_user.roles_updated || {};
            $scope.app_users.new_app_user.role_updated_disabled =  $scope.app_users.new_app_user.role_updated_disabled || {};

            $scope.app_users.new_app_user.roles_updated[newValue] = true;

            var props = Object.keys($scope.app_users.new_app_user.roles_updated);
            for (var i = 0; i < props.length; i++) {
                if (newValue == props[i]) {
                    $scope.app_users.new_app_user.role_updated_disabled[ props[i] ] = true;
                } else {
                    $scope.app_users.new_app_user.role_updated_disabled[ props[i] ] = false;
                }
            }
        }
    });

    $scope.$watch("current_app_user.repeat_pass", function(newValue) {
        if (newValue) {
            if (newValue===$scope.current_app_user.new_pass) {
                $scope.current_app_user.pass_matching = true;
            }else{
                $scope.current_app_user.pass_matching = false;
            }
        }
    });

    $scope.$watch("current_app_user.default_role_updated", function(newValue) {
        if (newValue) {
            $scope.app_users.current_app_user.roles_updated = $scope.app_users.current_app_user.roles_updated || {};
            $scope.app_users.current_app_user.role_updated_disabled =  $scope.app_users.current_app_user.role_updated_disabled || {};

            $scope.app_users.current_app_user.roles_updated[newValue] = true;

            var props = Object.keys($scope.app_users.current_app_user.roles_updated);
            for (var i = 0; i < props.length; i++) {
                if (newValue == props[i]) {
                    $scope.app_users.current_app_user.role_updated_disabled[ props[i] ] = true;
                } else {
                    $scope.app_users.current_app_user.role_updated_disabled[ props[i] ] = false;
                }
            }
        }
    });

    var buildTree = function(data, path, is_root_level) {
        var sub_tree = '<ul class="dfx-studio-explorer-treeview-content">';

        var props = Object.keys(data);
        for (var i = 0; i < props.length; i++) {
            if (data[ props[i] ].mandatory == 'true') continue;

            $scope.isThereOptionalProps = true;

            sub_tree += '<li>';

            var current_path = path + '.' + props[i];

            if (data[ props[i] ].type == 'subdocument') {
                sub_tree += '<input class="dfx-studio-explorer-treeview-button" type="checkbox" />' +
                    '<label ng-click="editUserDefinitionPropsNode(' + current_path + ', \'' + props[i] + '\',' + is_root_level + ', \'' + current_path + '\')">' + props[i] + '</label>';

                sub_tree += buildTree(data[ props[i]].structure, current_path + '.structure', false);
            } else {
                sub_tree += '<label ng-click="editUserDefinitionPropsNode(' + current_path + ', \'' + props[i] + '\',' + is_root_level + ', \'' + current_path + '\')">' + props[i] + '</label>';
            }

            sub_tree += '</li>';
        }
        sub_tree += '</ul>';

        return sub_tree;
    };

    var addTree = function(data) {
        $scope.isThereOptionalProps = false;
        var tree = buildTree(data, 'user_definition', true);

        var element = angular.element(tree);
        $compile(element.contents())($scope);
        $("#dfx_studio_user_properties_tree").html(element);
    };

    $scope.editUserDefinitionPropsNode = function(prop, prop_name, is_root_level, path_to_prop) {
        prop.defaults = getCurrentAppUserNodeValue(path_to_prop) || prop.defaults;

        $scope.user_definition.current_node = prop;
        $scope.user_definition.current_node_name = prop_name;
        $scope.user_definition.current_node_path = path_to_prop;
        $scope.user_definition.current_node_root_level = is_root_level;
    };

    var getCurrentAppUserNodeValue = function(user_def_path_to_prop) {
        var currentAppUserNodeValue = $scope.$parent.$parent.app_users.current_app_user || $scope.$parent.$parent.app_users.new_app_user;

        var splitPath = user_def_path_to_prop.split('.');
        for (var i = 0; i < splitPath.length; i++) {
            if (splitPath[i] == 'user_definition' || splitPath[i] == 'structure') continue;

            currentAppUserNodeValue = currentAppUserNodeValue ? currentAppUserNodeValue[ splitPath[i] ] : null;
        }
        return currentAppUserNodeValue;
    };

    function multiIndex(obj, is) {  // obj,['1','2','3'] -> ((obj['1'])['2'])['3']
        return is.length ? multiIndex(obj[is[0]], is.slice(1)) : obj
    }

    $scope.$watch("user_definition.current_node.defaults", function(newValue) {
        if (newValue) {
            var currentAppUser = $scope.$parent.$parent.app_users.current_app_user || $scope.$parent.$parent.app_users.new_app_user;

            var splitPath = $scope.user_definition.current_node_path.split('.').filter(function (elem) {
                return elem != 'user_definition' && elem != 'structure';
            });
            splitPath.splice(-1, 1);
            var currentAppUserNode = multiIndex(currentAppUser, splitPath);
            if (currentAppUserNode) currentAppUserNode[ $scope.user_definition.current_node_name ] = newValue;
        }
    });

    var collectAdditionalProperties = function(user_definition_data, app_user_data) {
        var props = Object.keys(user_definition_data);
        for (var i = 0; i < props.length; i++) {
            if (props[i].indexOf('current_node') == 0) continue;
            if (user_definition_data[ props[i] ].mandatory == 'true') continue;

            if (user_definition_data[ props[i] ].type == 'subdocument') {
                app_user_data[ props[i] ] = {};
                collectAdditionalProperties(user_definition_data[ props[i] ].structure, app_user_data[ props[i] ]);
            } else {
                app_user_data[ props[i] ] = user_definition_data[ props[i]].defaults;
            }
        }
    };
    //TODO:
    //1) drop-downs when editing user props for boolean etc (check if it's saved as "false" or false)
    //2) assign to variable as asked? already assigned normally
}]);

dfxStudioApp.controller("dfx_studio_user_definition_controller", [ '$scope', '$routeParams', '$mdDialog', '$compile', 'dfxMessaging', 'dfxUserDefinition',
    function($scope, $routeParams, $mdDialog, $compile, dfxMessaging, dfxUserDefinition)
{
    var parentScope = $scope.$parent.$parent;
    parentScope.user_definition = $scope;

    $scope.app_name = $routeParams.appname;

    function multiIndex(obj, is) {  // obj,['1','2','3'] -> ((obj['1'])['2'])['3']
        return is.length ? multiIndex(obj[is[0]], is.slice(1)) : obj
    }
    function pathIndex(obj, is) {   // obj,'1.2.3' -> multiIndex(obj,['1','2','3'])
        return multiIndex(obj, is.split('.'))
    }

    var buildTree = function(data, path, is_root_level) {
        var sub_tree = '<ul class="dfx-studio-explorer-treeview-content">';

        var props = Object.keys(data);
        for (var i = 0; i < props.length; i++) {
            if (props[i].indexOf('current_node') == 0) continue;

            sub_tree += '<li>';

            var current_path = path + '.' + props[i];

            if (data[ props[i] ].type == 'subdocument') {
                sub_tree += '<input class="dfx-studio-explorer-treeview-button" type="checkbox" />' +
                    '<label ng-click="editUserDefinitionNode(' + current_path + ', \'' + props[i] + '\',' + is_root_level + ', \'' + current_path + '\')">' + props[i] + '</label>';

                sub_tree += buildTree(data[ props[i]].structure, current_path + '.structure', false);
            } else {
                sub_tree += '<label ng-click="editUserDefinitionNode(' + current_path + ', \'' + props[i] + '\',' + is_root_level + ', \'' + current_path + '\')">' + props[i] + '</label>';
            }

            sub_tree += '</li>';
        }
        sub_tree += '</ul>';

        return sub_tree;
    };

    var addTree = function(data) {
        var tree = buildTree(data, 'user_definition', true);

        var element = angular.element(tree);
        $compile(element.contents())($scope);
        $("#dfx_studio_user_definition_tree").html(element);
    };

    var clearCurrentNode = function() {
        delete $scope.user_definition.current_node;
        delete $scope.user_definition.current_node_name;
        delete $scope.user_definition.current_node_path;
        delete $scope.user_definition.current_node_root_level;
    };

    dfxUserDefinition.getUserDefinition($scope, $scope.app_name).then(function (data) {
        $scope.user_definition = data;
        $scope.operation = 'update_user_definition';//to show properties area from the beginning
        addTree(data);
    });

    $scope.editUserDefinitionNode = function(prop, prop_name, is_root_level, path_to_prop) {
        $scope.operation = 'update_user_definition';
        $scope.user_definition.current_node = prop;
        $scope.user_definition.current_node_name = prop_name;
        $scope.user_definition.current_node_path = path_to_prop;
        $scope.user_definition.current_node_root_level = is_root_level;
    };

    $scope.unselectUserDefinitionNode = function() {
        $scope.operation = 'update_user_definition';
        clearCurrentNode();
    };

    var renameNode = function() {
        //TODO: check ALL nodes for renaming, not only current one - OR next solution -
        //TODO: call rename after each changes in node name? not too much to rebuild tree every time if typing too fast?

        // renaming node - remove node with old name and add same node with new name
        if ($scope.user_definition.current_node) {
            var lastPoint  = $scope.user_definition.current_node_path.lastIndexOf('.');
            var oldName    = $scope.user_definition.current_node_path.substring(lastPoint + 1);
            var parentPath = $scope.user_definition.current_node_path.substring(0, lastPoint);
            var parentObj  = pathIndex($scope, parentPath);
            if (oldName !== $scope.user_definition.current_node_name) {
                Object.defineProperty(parentObj, $scope.user_definition.current_node_name,
                    Object.getOwnPropertyDescriptor(parentObj, oldName));
                delete parentObj[oldName];
            }
            clearCurrentNode();
        }
    };

    $scope.updateUserDefinition = function() {
        renameNode();

        dfxUserDefinition.updateUserDefinition($scope, $scope.app_name, $scope.user_definition).then(function () {
            dfxMessaging.showMessage('User definition was successfully updated.');
            addTree($scope.user_definition);
        });
    };

    $scope.loadUserDefinitionCreationMenu = function($event) {
        $scope.closeUserDefinitionCreationMenu();
        var snippet = '<md-whiteframe style="left:'+($event.x-5)+'px;top:'+($event.y-5)+'px;width:200px" class="md-whiteframe-4dp dfx-studio-explorer-popmenu" ng-mouseleave="closeUserDefinitionCreationMenu()">';
        snippet += '<a href="" ng-click="addUserDefinitionObject()">Create Object</a><br>';
        snippet += '<a href="" ng-click="addUserDefinitionProperty()">Create Property</a>';
        snippet += '</md-whiteframe>';
        angular.element(document.getElementById('dfx-studio-main-body')).append($compile(snippet)($scope));
    };

    $scope.closeUserDefinitionCreationMenu = function($event) {
        $('.dfx-studio-explorer-popmenu').remove();
    };

    var subdocumentDef = {
        mandatory: 'false',
        pass: 'false',
        type: 'subdocument',
        structure: {}
    };

    var propertyDef = {
        defaults: '',
        mandatory: 'false',
        pass: 'false',
        title: 'property',
        type: 'string'
    };

    $scope.addUserDefinitionObject = function() {
        var subdocumentDefCopy = angular.copy(subdocumentDef);

        if ($scope.user_definition.current_node && $scope.user_definition.current_node.type == 'subdocument' && $scope.user_definition.current_node.mandatory == 'true')
        {
            dfxMessaging.showWarning($scope.user_definition.current_node_name + ' is a main property and can not be modified');
        }
        else if ($scope.user_definition.current_node && $scope.user_definition.current_node.type != 'subdocument') {
            dfxMessaging.showWarning('New object can be added only to another object.');
        }
        else if ($scope.user_definition.current_node && $scope.user_definition.current_node.type == 'subdocument' &&
            $scope.user_definition.current_node.mandatory != 'true' && $scope.user_definition.current_node.structure.new_object)
        {
            dfxMessaging.showWarning('Object with that name already exists at this level.');
        }
        else if (!$scope.user_definition.current_node && $scope.user_definition.new_object)
        {
            dfxMessaging.showWarning('Object with that name already exists at this level.');
        }
        else if ($scope.user_definition.current_node && $scope.user_definition.current_node.type == 'subdocument' && $scope.user_definition.current_node.mandatory != 'true')
        {
            $scope.user_definition.current_node.structure.new_object = subdocumentDefCopy;
        }
        else if (! $scope.user_definition.current_node)
        {
            $scope.user_definition.new_object = subdocumentDefCopy;
        }

        addTree($scope.user_definition);
    };

    $scope.addUserDefinitionProperty = function() {
        var propertyDefCopy = angular.copy(propertyDef);

        if ($scope.user_definition.current_node && $scope.user_definition.current_node.type == 'subdocument' && $scope.user_definition.current_node.mandatory == 'true')
        {
            dfxMessaging.showWarning($scope.user_definition.current_node_name + ' is a main property and can not be modified');
        }
        else if ($scope.user_definition.current_node && $scope.user_definition.current_node.type != 'subdocument') {
            dfxMessaging.showWarning('New property can be added only to object.');
        }
        else if ($scope.user_definition.current_node && $scope.user_definition.current_node.type == 'subdocument' &&
            $scope.user_definition.current_node.mandatory != 'true' && $scope.user_definition.current_node.structure.new_property)
        {
            dfxMessaging.showWarning('Property with that name already exists at this level.');
        }
        else if (!$scope.user_definition.current_node && $scope.user_definition.new_property)
        {
            dfxMessaging.showWarning('Property with that name already exists at this level.');
        }
        else if ($scope.user_definition.current_node && $scope.user_definition.current_node.type == 'subdocument' && $scope.user_definition.current_node.mandatory != 'true')
        {
            $scope.user_definition.current_node.structure.new_property = propertyDefCopy;
        }
        else if (! $scope.user_definition.current_node)
        {
            $scope.user_definition.new_property = propertyDefCopy;
        }

        addTree($scope.user_definition);
    };

    $scope.delete = function() {
        if ($scope.user_definition.current_node && $scope.user_definition.current_node.mandatory == 'true') {
            dfxMessaging.showWarning($scope.user_definition.current_node_name + ' is a main property and can not be removed');
            return;
        }

        var lastPoint = $scope.user_definition.current_node_path.lastIndexOf('.');
        var oldName = $scope.user_definition.current_node_path.substring(lastPoint + 1);
        var parentPath = $scope.user_definition.current_node_path.substring(0, lastPoint);
        var parentObj = pathIndex($scope, parentPath);
        delete parentObj[oldName];

        clearCurrentNode();
        addTree($scope.user_definition);
        dfxUserDefinition.updateUserDefinition($scope, $scope.app_name, $scope.user_definition);
    };

    $scope.confirmDelete = function(ev) {
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want to remove this node?')
            .textContent('This node will be removed from repository.')
            .ariaLabel('remove node')
            .targetEvent(ev)
            .cancel('Cancel')
            .ok('OK');
        $mdDialog.show(confirm).then(function() {
            $scope.delete();
        }, function() {
        });
    };
}]);

dfxStudioApp.controller("dfx_studio_api_so_controller", [ '$rootScope', '$scope', '$routeParams', '$location', '$http', '$q', '$mdSidenav', '$mdDialog', '$timeout', 'dfxMessaging', 'dfxApplications', 'dfxAuthProviders', 'dfxApiServiceObjects', function($rootScope, $scope, $routeParams, $location, $http, $q, $mdSidenav, $mdDialog, $timeout, dfxMessaging, dfxApplications, dfxAuthProviders, dfxApiServiceObjects) {
    $scope.app_name = $routeParams.appname;
    $scope.api_so = {
        "application": $scope.app_name,
        "category": "Default",
        "name": "SampleService",
        "description": "This is a sample Service",
        "selector": "root",
        "visibility": "visible",
        "lock": { "status": "unlocked" },
        "apiRoutes": []
    };

    var sufix = '';
    for(var i = 0;  i < 3; i++) {
        sufix += Math.floor(Math.random() * 10);
    }
    $scope.api_so.name += sufix;

    $scope.serviceMode = 'serviceAdd';
    $scope.serviceModeBtn = 'serviceAdd';

    if ( $routeParams.categoryname ) {
        $scope.api_so.category = $routeParams.categoryname;
    }

    if ( $routeParams.api_so_name ) {
        $scope.serviceMode = 'serviceEdit';
        $scope.serviceModeBtn = 'serviceEdit';
        $scope.api_so_name = $routeParams.api_so_name;
        dfxApiServiceObjects.getOne( $scope, $scope.app_name, $scope.api_so_name ).then( function( data ) {
            $scope.api_so = data.data.query;
            $scope.api_so.persistence = 'none';
            delete $scope.api_so._id;
            $scope.api_so.apiRoutes = data.data.apiRoutes;
        });
    }

    var unsaved = false;
    $scope.$on('$locationChangeStart', function($event, newUrl) {
        var newUrl = newUrl.split('#')[1];
        if ( !unsaved && $scope.serviceMode === 'serviceEdit' ) {
            var formatedRoutes = [];
            dfxApiServiceObjects.getOne( $scope, $scope.app_name, $scope.api_so_name ).then( function( data ) {
                if ( data.data.query ) {
                    var from_server = data.data.query;
                    delete from_server._id;
                    angular.forEach(from_server.apiRoutes, function (value, key) {
                        formatedRoutes.push({
                            "name": key,
                            "data": value
                        });
                    });
                    from_server.apiRoutes = formatedRoutes;
                    from_server.requestDate = $scope.api_so.requestDate;
                    from_server.persistence = $scope.api_so.persistence;

                    var equalApi = angular.equals($scope.api_so, from_server);

                    if ( !equalApi ) {
                        var confirm = $mdDialog.confirm()
                            .title('Are you sure to exit the API Service Object Editor?')
                            .textContent('All changes will be lost.')
                            .ariaLabel('leave API SO')
                            .targetEvent(null)
                            .cancel('Cancel')
                            .ok('OK');
                        $mdDialog.show(confirm).then(function() {
                            unsaved = true;
                            $location.path(newUrl);
                        }, function() {
                        });
                    } else {
                        unsaved = true;
                        $location.path(newUrl);
                    }
                } else {
                    unsaved = true;
                    $location.path(newUrl);
                }
            });
            $event.preventDefault();
        } else if ( !unsaved && $scope.serviceMode === 'serviceAdd' ) {
            if ( $location.path() !== ('/api_so/update/' + $scope.app_name + '/' + $scope.api_so.name) ) {
                var confirm = $mdDialog.confirm()
                    .title('Are you sure to exit the API Service Object Editor?')
                    .textContent('All changes will be lost.')
                    .ariaLabel('leave API SO')
                    .targetEvent(null)
                    .cancel('Cancel')
                    .ok('OK');
                $mdDialog.show(confirm).then(function() {
                    unsaved = true;
                    $location.path(newUrl);
                }, function() {
                });
                $event.preventDefault();
            } else {
                unsaved = true;
                $location.path(newUrl);
            }
        }
    });

    $scope.api_sources = [];
    var popupServices = document.getElementById('add-services'),
        popupServicesMask = document.getElementById('add-services-backdrop'),
        bodyHeight = parseFloat($("body").css('height'));
    $timeout(function() {
        var scopeSourceTable = document.getElementById('scope-source-table');
        $(scopeSourceTable).css('max-height', bodyHeight-320);
    }, 0);

    dfxApiServiceObjects.getAll( $scope, $scope.app_name ).then( function( data ) {
        $scope.strongLoopProvider = '';
        for ( var i = 0; i < data.data.data.length; i++ ) {
            $scope.api_sources.push( data.data.data[i] );
        };
    });

    dfxApiServiceObjects.getCategories( $scope, $scope.app_name ).then( function( data ) {
        $scope.apiSoCategories = data.data.querycats;
    });

    dfxApiServiceObjects.getCatalog( $scope ).then( function( data ) {
        $scope.notAuthSources = [];
        $scope.catalogSources = data.data;
        for ( var key in $scope.catalogSources ) {
            if ( $scope.catalogSources[key].auth === false ) {
                $scope.notAuthSources.push({
                    "datasource": key,
                    "auth"      : $scope.catalogSources[key].auth,
                    "data"      : $scope.catalogSources[key].data
                });
            }
        }
        $scope.listSources = [];
    });

    $scope.validateServiceUrls = function() {
        $scope.urlErrors = [];
        var getPromise = function(i) {
            var deferred = $q.defer();

            dfxApiServiceObjects.validateSoUrl( $scope, $scope.api_so.apiRoutes[i].name, $scope.app_name, $scope.api_so.apiRoutes[i].data.uuid )
                .then(function( data ) {
                    if ( data.data.data ) {
                        $scope.notValidUrl = true;
                        $scope.notValidUrlName = $scope.api_so.apiRoutes[i].name;
                        var urlErrorItem = {
                            "index": i,
                            "errorUrl": $scope.api_so.apiRoutes[i].name,
                            "errorName": data.data.data
                        }
                        $scope.urlErrors.push(urlErrorItem);
                    }
                    deferred.resolve();
                });

            return deferred.promise;
        };

        $scope.notValidUrl = false;
        $scope.notValidUrlName = '';
        var total = $scope.api_so.apiRoutes.length;
        var promises = [];
        for (var i = 0; i < total; i++) {
            promises.push(getPromise(i));
        };

        return $q.all(promises);
    }

    $scope.saveApiSo = function() {
        $scope.api_so.application = $scope.app_name;
        $scope.renderRoutesFilters();
        if ( $scope.notRenderedFilters ) {
            dfxMessaging.showWarning("API Route " + $scope.notRenderedFilterName + " filters name can't be empty");
        } else {
            $scope.validateServiceUrls().then(function () {
                $scope.urlErrors.sort(function (a, b) {
                    return a.index - b.index;
                });
                if ($scope.urlErrors.length > 0) {
                    switch ($scope.urlErrors[0].errorName) {
                        case 'Service url name incorrect':
                            dfxMessaging.showWarning('Service url name "' + $scope.urlErrors[0].errorUrl + '" is incorrect');
                            break;
                        case 'Current service url already exists':
                            dfxMessaging.showWarning('Service url "' + $scope.urlErrors[0].errorUrl + '" already exists');
                            break;
                    }
                } else {
                    if ($scope.api_so.name) {
                        dfxApiServiceObjects.createSo($scope, $scope.api_so).then(function (data) {
                            if (data.status && data.status === 200 && data.data.data === 'API Route created!') {
                                dfxMessaging.showMessage('The API Service Object has been created');
                                $scope.getAll();
                                $location.path('/api_so/update/' + $scope.api_so.application + '/' + $scope.api_so.name);
                            } else {
                                dfxMessaging.showWarning(data.data.data);
                            }
                        }, function (data) {
                            dfxMessaging.showWarning(data.data.error.message);
                        });
                    } else {
                        $scope.selected_tab = 0;
                        $scope.serviceNameError = "Service name cannot be empty";
                        $scope.validNameResult = 'failed';
                        dfxMessaging.showWarning('There was an error trying to create the new API Service Object');
                    }
                }
            });
        }
    }

    $scope.updateApiSo = function() {
        $scope.api_so.application = $scope.app_name;
        $scope.renderRoutesFilters();
        if ( $scope.notRenderedFilters ) {
            dfxMessaging.showWarning("API Route " + $scope.notRenderedFilterName + " filters name can't be empty");
        } else {
            $scope.validateServiceUrls().then(function() {
                $scope.urlErrors.sort(function(a,b) {
                    return a.index - b.index;
                });
                if ( $scope.urlErrors.length > 0 ) {
                    switch ( $scope.urlErrors[0].errorName ) {
                        case 'Service url name incorrect': dfxMessaging.showWarning('Service url name "' + $scope.urlErrors[0].errorUrl + '" is incorrect'); break;
                        case 'Current service url already exists': dfxMessaging.showWarning('Service url "' + $scope.urlErrors[0].errorUrl + '" already exists'); break;
                    }
                } else {
                    dfxApiServiceObjects.updateSo( $scope, $scope.api_so ).then(function( data ) {
                        if ( data.status && data.status === 200 ) {
                            dfxMessaging.showMessage('The API Service Object has been successfully updated');
                            dfxApiServiceObjects.getOne( $scope, $scope.app_name, $scope.api_so_name ).then(function( data ) {
                                if ( data.data.apiRoutes ) {
                                    $scope.api_so.apiRoutes = data.data.apiRoutes;
                                    $scope.getAll();
                                }
                            });
                        } else {
                            dfxMessaging.showWarning('There was an error trying to update the API Service Object');
                        }
                    });
                }
            });
        }
    }

    $scope.renderRoutesFilters = function() {
        $scope.areEmptyFilterNames = [];
        $scope.notRenderedFilters = false;
        $scope.notRenderedFilterName = '';
        for ( var i = 0; i < $scope.api_so.apiRoutes.length; i++ ) {
            $scope.renderFilters( $scope.api_so.apiRoutes[i] );
            var isEmptyTemp = {
                "value": $scope.isEmptyFilterName,
                "name": $scope.api_so.apiRoutes[i].name
            };
            $scope.areEmptyFilterNames.push( isEmptyTemp );
        }
        for ( var i = 0; i < $scope.areEmptyFilterNames.length; i++ ) {
            if ( $scope.areEmptyFilterNames[i].value ) {
                $scope.notRenderedFilters = true;
                if ( $scope.notRenderedFilterName === '' ) {
                    $scope.notRenderedFilterName = $scope.areEmptyFilterNames[i].name;
                }
            }
        }
    }

    $scope.deleteApiSo = function() {
        dfxApiServiceObjects.deleteSo( $scope, $scope.api_so ).then(function( data ) {
            dfxMessaging.showMessage( data.data.data );
            $scope.getAll();
            unsaved = true;
            $location.path('/home');
        });
    }

    $scope.confirmApiSoDelete = function( ev ) {
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want to remove this API Service Object?')
            .textContent('This API Service Object will be removed from repository.')
            .ariaLabel('remove API Service Object')
            .targetEvent(ev)
            .cancel('Cancel')
            .ok('OK');
        $mdDialog.show(confirm).then(function() {
            $scope.deleteApiSo();
        }, function() {
        });
    }

    $scope.addService = function() {
        $scope.validUrlResult = '';
        $scope.serviceUrlError = '';
        $scope.selected_service_tab = 0;
        $scope.scopeService = {};
        $scope.editFilterTitle = null;
        var dataSourceIcon = $(".dfx-api-so-sources");
        dataSourceIcon.hide();
        var api_so_route_snippet = {
            "name": "",
            "data": {
                "metadata": "",
                "settings": {
                    "source": "ext",
                    "connector": "http",
                    "postrequestbody": "",
                    "authentication": "none",
                    "auth_password": "",
                    "typerequest": "HTTP_GET",
                    "urlrandom": "0",
                    "auth_userid": "",
                    "cache":"none",
                    "cacheTimeExpiry" : 0,
                    "url": "",
                    "dbdriver": "",
                    "dbnames": { "database": "", "collection": "" }
                },
                "parameters": [],
                "precode": [],
                "postcode": [],
                "appexpr": [],
                "service": { "method": "" },
                "format": "json"
            }
        };
        $scope.scopeService = api_so_route_snippet;
        $scope.serviceModeBtn = 'serviceAdd';
        $scope.checkDatasource();
        $timeout(function() {
            $scope.isExecuted = false;
            $("#showResults").css('opacity',0);
            $("#executedResult").val();
        }, 0);

        var sideNavInstance = $mdSidenav('side_nav_add_service'),
            sidenav = $("md-sidenav[md-component-id='side_nav_add_service']"),
            sidenavHeight = sidenav.height();
        $timeout(function(){
            sidenav.find(".sidenav-service").css( "max-height", sidenavHeight-145 );
            sidenav.find("#dfx_filter_src_query_editor").css( "height", sidenavHeight-280 );
            var editor = $('#dfx_filter_src_query_editor.CodeMirror')[0].CodeMirror;
            editor.setValue('');
            $scope.isExecuted = false;
            $("#showResults").css('opacity',0);
            $("#executedResult").val();
            $scope.editorOpened = false;
        }, 0);
        sideNavInstance.toggle();
    }

    $scope.addServices = function() {
        $scope.serviceModeBtn = 'addServices';
        $scope.servicesApiSource = 'none';
        var dataSourceIcon = $(".dfx-api-so-sources");
        dataSourceIcon.hide();
        $('#add-services').fadeIn(150);
        $('#add-services-backdrop').fadeIn(150);
    }

    $('body #add-services-backdrop').on('click', function(){
        $('#add-services').fadeOut(150);
        $('body #add-services-backdrop').fadeOut(150);
    });

    $scope.singleGroup = function( ev ) {
        $timeout(function() {
            var element = ev.target,
                checked = $(element).parent().attr('aria-checked');
            if ( $scope.restSource === false ) {
                allCheckboxes = $(".service-checkbox");
            } else {
                allCheckboxes = $(element).parent().parent().siblings().find(".service-checkbox");
            }
            if ( checked === 'true' ) {
                angular.forEach(allCheckboxes, function(item) {
                    if ( $(item).attr('aria-checked') === 'false' ) {
                        angular.element(item).triggerHandler("click");
                    }
                });
            } else {
                angular.forEach(allCheckboxes, function(item) {
                    if ( $(item).attr('aria-checked') === 'true' ) {
                        angular.element(item).triggerHandler("click");
                    }
                });
            }
        }, 0);
    }

    $scope.pushServices = function() {
        if ( $scope.restSource === false ) {
            var checkedServices = $(".api-datasource .service-checkbox");
            for (var i = 0; i < checkedServices.length; i++) {
                var checkedAttr = $(checkedServices[i]).attr('aria-checked');
                if ( checkedAttr === 'true' ) {
                    var newRoute = $scope.listSources[i];
                    newRoute.data.settings.authentication = $scope.selectedDataSource;
                    if ( !newRoute.data.parameters ) newRoute.data.parameters = [];
                    if ( !newRoute.data.precode ) newRoute.data.precode = [];
                    if ( !newRoute.data.postcode ) newRoute.data.postcode = [];
                    if ( !newRoute.data.appexpr ) newRoute.data.appexpr = [];
                    $scope.api_so.apiRoutes.push(newRoute);
                }
            };
        } else {
            var restItems = $(".api-datasource .rest-item");
            for (var i = 0; i < restItems.length; i++) {
                var restItemCheckboxes = $(restItems[i]).find('.service-checkbox');
                for (var j = 0; j < restItemCheckboxes.length; j++) {
                    var checkedAttr = $(restItemCheckboxes[j]).attr('aria-checked');
                    if ( checkedAttr === 'true' ) {
                        var newRoute = $scope.strongLoopList[i].data[j];
                        newRoute.data.settings.authentication = $scope.selectedDataSource;
                        if ( !newRoute.data.parameters ) newRoute.data.parameters = [];
                        if ( !newRoute.data.precode ) newRoute.data.precode = [];
                        if ( !newRoute.data.postcode ) newRoute.data.postcode = [];
                        if ( !newRoute.data.appexpr ) newRoute.data.appexpr = [];
                        $scope.api_so.apiRoutes.push(newRoute);
                    }
                };
            };
        }
        $('#add-services').fadeOut(150);
        $('#add-services-backdrop').fadeOut(150);
        $scope.showListSources = false;
        $mdDialog.hide();
    }

    $scope.closeSources = function() {
        $('#add-services').fadeOut(150);
        $('#add-services-backdrop').fadeOut(150);
    }

    $scope.validateServiceName = function() {
        $scope.validNameResult = '';
        $scope.serviceNameError = '';
        dfxApiServiceObjects.validateSoName( $scope, $scope.api_so.name, $scope.app_name ).then(function( data ) {
            if ( data.data.data !== '' ) {
                $scope.validNameResult = 'failed';
                $scope.serviceNameError = data.data.data;
            }
        });
    }

    $scope.validateServiceUrl = function() {
        $scope.validUrlResult = '';
        $scope.serviceUrlError = '';
        dfxApiServiceObjects.validateSoUrl( $scope, $scope.scopeService.name, $scope.app_name, $scope.scopeService.data.uuid ).then(function( data ) {
            if (( data.data.data !== '' ) && ($scope.currentEditingUrlName !== $scope.scopeService.name)) {
                $scope.validUrlResult = 'failed';
                $scope.serviceUrlError = data.data.data;
            }
        });
    }

    $scope.saveApiSoService = function() {
        $scope.renderFilters( $scope.scopeService );
        if ( $scope.isEmptyFilterName ) {
            dfxMessaging.showWarning("Filter name can't be empty");
            $scope.selected_service_tab = 2;
        } else {
            if ($scope.api_so.apiRoutes.length === 0 && $scope.scopeService.name !== '') {
                $scope.api_so.apiRoutes.push($scope.scopeService);
                //$scope.scopeService = {};
                var sideNavInstance = $mdSidenav('side_nav_add_service');
                sideNavInstance.toggle();
            } else if ($scope.api_so.apiRoutes.length > 0 && $scope.validUrlResult === '') {
                $scope.api_so.apiRoutes.push($scope.scopeService);
                //$scope.scopeService = {};
                var sideNavInstance = $mdSidenav('side_nav_add_service');
                sideNavInstance.toggle();
            } else if ($scope.api_so.apiRoutes.length === 0 && $scope.scopeService.name === '') {
                $scope.validUrlResult = 'failed';
                $scope.serviceUrlError = 'Service url name cannot be empty';
            }
        }
    }

    $scope.checkDatasource = function() {
        for (var i = 0; i < $scope.api_sources.length; i++) {
            if ( $scope.scopeService.data.settings.authentication === $scope.api_sources[i].provider ) {
                if ( $scope.api_sources[i].schema === 'public/rest' ) {
                    $scope.restSource = true;
                } else {
                    $scope.restSource = false;
                }
                if ( $scope.scopeService.data.settings.authentication === 'none' ) {
                    $scope.listSources = $scope.notAuthSources;
                    $scope.dataSource = 'none';
                    $scope.selectedDataSource = 'none';
                } else {
                    $scope.dataSource = $scope.api_sources[i].dataSource;
                    if ($scope.catalogSources[$scope.dataSource]!=null) {
                        $scope.listSources = $scope.catalogSources[$scope.dataSource].data;
                    } else {
                        $scope.listSources = $scope.notAuthSources;
                    }
                    $scope.selectedDataSource = $scope.scopeService.data.settings.authentication;
                }
            }
        };
    }

    $scope.showCurl = function ( serviceItem ) {
        var currentAPIUrl = $scope.api_so.apiRoutes.filter(function(apiRoute){
            return apiRoute.name == serviceItem.name;
        });
        var parameters = currentAPIUrl[0].data.parameters;
        var body = currentAPIUrl[0].data.settings.postrequestbody;
        var queryString = {"params":{},"body":body}
        parameters.forEach(function(param){
            queryString.params[param.name] = param.value;
        });
        $scope.curlItemMessage = serviceItem.name;
        $scope.parameters = parameters;
        $scope.body = body;

        dfxApiServiceObjects.getTenant( $('body').attr('data-tenantid'))
            .then(function(tenant) {
                if (tenant.data.data.databaseTokens) {
                    var str = "curl -i ";
                        str += "-H 'Content-Type:application/json' ";
                        str += "-H 'Authorization:Basic " + btoa($('body').attr('data-tenantid') + ":" + Object.keys(tenant.data.data.databaseTokens)[0]) + "==' ";
                        str += "-d '{}' ";
                        str += window.location.origin + '/api/' + $scope.app_name + '/apiRoute/' + serviceItem.name;
                    $scope.curlItemContent = str;

                    var str = "curl -i ";
                    str += "-H 'Content-Type:application/json' ";
                    str += "-H 'Authorization:Basic " + btoa($('body').attr('data-tenantid') + ":" + Object.keys(tenant.data.data.databaseTokens)[0]) + "==' ";
                    str += "-d '" + JSON.stringify(queryString) + "' ";
                    str += window.location.origin + '/api/' + $scope.app_name + '/apiRoute/' + serviceItem.name;
                    $scope.curlItemContentWithParameters = str;

                    //console.log($scope.curlItemContentWithParameters);

                    $scope.postmanUrl = window.location.origin + '/api/' + $scope.app_name + '/apiRoute/' + serviceItem.name;
                    $scope.postmanUsername = $('body').attr('data-tenantid');
                    $scope.postmanPassword = Object.keys(tenant.data.data.databaseTokens)[0];
                } else {
                    $scope.curlItemContent = "Can't get tenant token from server";
                }

            },function(err) {
                $scope.curlItemContent = "Can't get tenant token from server." + err;
            });
        var sideNavInstance = $mdSidenav('side_nav_curl');
        $('#curl_content_span').hide();
        $('#curl_content_with_parameters_span').hide();
        sideNavInstance.toggle();
    }

    $scope.copyToClipboard = function(id) {
        $('#' + id).select();
        document.execCommand("copy");
        $('#' + id +'_span').show();
    }

    $scope.editService = function( serviceItem ) {
        $scope.selected_service_tab = 0;
        $scope.validUrlResult = '';
        $scope.serviceUrlError = '';
        $scope.scopeService = serviceItem;
        $scope.editFilterTitle = null;
        if ( !serviceItem.data.parameters ) $scope.scopeService.data.parameters = [];
        if ( !serviceItem.data.precode ) $scope.scopeService.data.precode = [];
        if ( !serviceItem.data.postcode ) $scope.scopeService.data.postcode = [];
        if ( !serviceItem.data.appexpr ) $scope.scopeService.data.appexpr = [];
        $scope.currentEditingUrlName = !$scope.currentEditingUrlName ? serviceItem.name : $scope.currentEditingUrlName;
        $scope.checkDatasource();
        $scope.serviceModeBtn = 'serviceEdit';
        var sideNavInstance = $mdSidenav('side_nav_add_service');
        sidenav = $("md-sidenav[md-component-id='side_nav_add_service']"),
        sidenavHeight = sidenav.height();
        sideNavInstance.toggle();
        $timeout(function() {
            sidenav.find(".sidenav-service").css( "max-height", sidenavHeight-145 );
            sidenav.find("#dfx_filter_src_query_editor").css( "height", sidenavHeight-280 );
            var editor = $('#dfx_filter_src_query_editor.CodeMirror')[0].CodeMirror;
            editor.setValue('');
            $scope.isExecuted = false;
            $("#showResults").css('opacity',0);
            $("#executedResult").val();
            $scope.editorOpened = false;
        }, 0);
    }

    $scope.deleteService = function( index ) {
        $scope.api_so.apiRoutes.splice( index, 1 );
    }

    $scope.confirmDelete = function( ev, index ) {
        var confirm = $mdDialog.confirm()
        });