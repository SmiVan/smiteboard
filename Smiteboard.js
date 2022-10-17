// ==UserScript==
// @name         Smiteboard
// @namespace    https://github.com/SmiVan/smiteboard
// @version      0.1.1
// @description  Witeboard Extension
// @author       SmiVan
// @match        https://witeboard.com/*-*-*-*-*$
// @icon         https://raw.githubusercontent.com/SmiVan/smiteboard/main/assets/logo.ico
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    window.Smiteboard={};

    const log = window.Smiteboard.log = (msg, obj) => {
        console.log(`Smiteboard > ${msg}`);
        if(obj !== undefined) { console.log(obj) };
    };

    window.stop();
    log("Stop...");
    let buttons = [ // Ordered in reverse (right-to-left)
        [{ // Save tool
            textContent: "⚓\uFE0E",
            onclick: () => {
                let link = document.querySelector('#smiteboard-download-svg');
                if (!link) {
                    link = document.createElement("a");
                    link.hidden = true;
                }
                link.href = URL.createObjectURL(new Blob([document.querySelector('svg').outerHTML], { type: 'image/svg+xml' }));
                link.download = `${document.querySelector('.toolbar-title-input').value}.${Date.now()}.svg`;
                link.click();
            },
        }, {}],
        [{ // Nuke tool
            textContent: "☢\uFE0E",
            onclick:() => {
                let target="temp0";
                if(!window.temp0) {
                    log("Nothing to nuke!");
                    return;
                }
                Object.keys(window).forEach(key => {
                    const match = key.match(/^temp[0-9]+$/);
                    if(match && window[match[0]]?.tagName === "path") {
                        target = match[0];
                        if(window[target].tagName !== "path" || window[target].parentElement?.tagName !== "svg") {
                            log("Unable to nuke illegal target:", window[target]);
                            return;
                        }
                        const path_index = Array.from(window[target].parentElement.children).indexOf(window[target]);
                        if(path_index === -1) {
                            log("Unable to nuke ghost element:", window[target]);
                            return;
                        }
                        if(!window.Smiteboard.briefcase) {
                            log(`Would nuke path #${path_index}`, window.DrawingBoard.state.paths[path_index]);
                            return;
                        }
                        window[target]=window.DrawingBoard.state.paths[path_index];
                        log(`Nuking path #${path_index}:`, window[target]);

                        window.DrawingBoard.nukePath(window[target]);
                    }
                });

                // A listener can be made here to catch the element pointed to?
            }
        }, {}]
    ];

    const switch_menu = (menu_button) => {
        buttons.forEach(button => {button.hidden = !button.hidden});
    };

    window.Smiteboard.load_scripts = (() => {
        const jscolor = Object.assign(document.createElement("script"), {src:"https://jscolor.com/release/2.5/jscolor-2.5.0/jscolor.js"});
        jscolor.onload = () => {
            window.jscolor.init();
            log("Loaded JSColor!");
        };
        document.querySelector('html').appendChild(jscolor);
    });

    window.Smiteboard.build_menu = (() => {
        const buttons_style = `
            padding: 0;
            line-height: 0;
            width: 36px;
            height: 36px;
            font-size: x-large;
            text-shadow: 0 0 2px #000, 0 0 2px #000, 0 0 2px #000, 0 0 2px #000, 0 0 2px #000, 0 0 2px #000,
                         0 5px 5px #0cc, -4px -3px 5px #cc0, 4px -3px 5px #c0c, 0 -5px 5px #c00, 4px 3px 5px #00c, -4px 3px 5px #0c0;
        `;

        const menu_button = document.querySelector(".toolbar-share-button");
        menu_button.textContent = "↯";
        menu_button.style = buttons_style;
        menu_button.style['font-size'] = 'x-large';
        menu_button.onclick = () => switch_menu(menu_button);
        menu_button.nextElementSibling.remove();
        menu_button.parentElement.style = `
            display: flex;
            flex-direction: row-reverse;
            gap: 4px;
        `

        buttons = buttons.map(([data, attrs]) => {
            const button = Object.assign(document.createElement('button'), data);
            button.style = buttons_style;
            button.classList.add("toolbar-share-button");
            button.hidden = true;
            menu_button.parentElement.appendChild(button);
            return button;
        });

        return menu_button;
    })//();

    window.Smiteboard.colorpicker = (component) => {
        return () => {

            window.jscolor.presets.default = {
                format:'rgba', palette: window.Smiteboard.colorpicker.palette.join(','), shadow:false, position:'top'//, closeButton:true, closeText:'Save'
            };

            const colorpicker = new window.JSColor(document.createElement('input'), {});
            window.Smiteboard.colorpicker.valueElement = colorpicker.valueElement;
            const current_color_style = document.querySelector('div.footer-color-state span').getAttribute("style");
            const current_color = current_color_style.match(/rgba?\([0-9 ,\.]*\)/);
            colorpicker.fromString(current_color ? current_color[0] : window.Smiteboard.colorpicker.pick_random_color());
            document.querySelector(`#${window.Smiteboard.colorpicker.imgid_colorpicker}`).parentNode.appendChild(colorpicker.valueElement);
            colorpicker.show();
            document.querySelector('.jscolor-wrap').style.margin="-8px -28px"; // Aligning to centre.

            //const btn_close = document.querySelector('.jscolor-picker .jscolor-btn-close');
            const html = document.querySelector('html');

            const remove_listeners = function(event) {
                //btn_close.removeEventListener('mousedown', listener_btn_close);
                html.removeEventListener('mousedown', listener_escape);
            }

            const listener_btn_close = function (event) {
                remove_listeners();
                window.Smiteboard.colorpicker_set_color({on_select_option: component.onSelectOption});
            };
            //btn_close.addEventListener('mousedown', listener_btn_close);

            const listener_escape = function (event) {
                let target = event.target || event.srcElement;
                let found = false;
                while(!found && target) {
                    found = Array.from(target.classList).map(c => Boolean(c.match(/(jscolor|footer-color)/))).reduce((acc, elem) => acc || elem, false);
                    target = target.parentElement;
                }
                if(!found) { // No JSColor element found - means we clicked outside
                    listener_btn_close(event);
                    colorpicker.hide();
                }
            };
            html.addEventListener('mousedown', listener_escape);
        };
    };
    window.Smiteboard.colorpicker.imgid_colorpicker = 'smiteboard-colorpicker';
    window.Smiteboard.colorpicker.imgid_colorbar = 'smiteboard-replace-me-colorbar';
    window.Smiteboard.colorpicker.palette = [
        'rgba(243,83,83,1)',//'#f35353',
        'rgba(255,155,60,1)',//'#ff9b3c',
        'rgba(255,211,53,1)',//'#ffd335',
        'rgba(38,194,129,1)',//'#26c281',
        'rgba(43,144,239,1)',//'#2b90ef',
        'rgba(106,70,250,1)',//'#6a46fa',
        'rgba(176,93,217,1)',//'#b05dd9',
        'rgba(34,34,34,1)',//'#222222',
        'rgba(255,255,255,1)',//'#ffffff'
    ];
    window.Smiteboard.colorpicker.pick_random_color = () => window.Smiteboard.colorpicker.palette[Math.floor(Math.random() * (8))];
    window.Smiteboard.colorpicker_set_color = (/*one of*/funcs) => {
       const color = window.Smiteboard.colorpicker.valueElement?.value || window.Smiteboard.colorpicker.pick_random_color();
       funcs.on_change ? funcs.on_change(color) : null;
       funcs.on_select_option ? funcs.on_select_option({color: color}) : null;
    };

    window.Smiteboard.on_drawing_board_render = () => {
        log("ONLINE!!!!!!!!!!!!!!!");
        //document.querySelector(`#${window.Smiteboard.colorpicker.imgid_colorbar}`).remove();
        //window.Smiteboard.colorpicker_set_color({on_change: window.Smiteboard.colorpicker.component.props.onChange});
    }

    const mods = {
        0: (lines => { // Application
            lines.splice(-1, 0, `
                Smiteboard.log("Loading scripts...");
                Smiteboard.load_scripts();
                Smiteboard.log("Building menu...");
                Smiteboard.build_menu();
            `);
            return lines;
        }),
        61: (lines => { // Color picker
            lines[106] = `{className: 'footer-color-selector clearfix'},`;
            lines[107] = `[_react2.default.createElement('img',{id: Smiteboard.colorpicker.imgid_colorpicker, onLoad: Smiteboard.colorpicker(_this), 'src': '/favicon.ico?id=picker', hidden: 'true'})]`;
            //lines.splice(120, 0, `, _react2.default.createElement('img',{id :Smiteboard.colorpicker.imgid_colorbar, onLoad: Smiteboard.colorpicker.component = _this, 'src': '/favicon.ico?id=footer', hidden: 'true'})]`);
            //lines.splice(119, 0, '[');
            return lines;
        }),
        339: (lines => { // DrawingBoard
            //lines.forEach((line, i) => {if(line.match("pathObjs.push._react2.default.createElement._Path2.default")) { log(`Found ${i}`, line); }});
            // These have to be in reverse to splice correctly.
            //lines.splice(1496, 0, `if(paths.length && Smiteboard.on_drawing_board_render) { const call = Smiteboard.on_drawing_board_render; Smiteboard.on_drawing_board_render = undefined; call(); }`);
            lines.splice(1040, 0, `}, _this.nukePath = function (path) {
	            _io.socket.emit('deletePath', path.id);
	            _this.deletePath(path.id);

	            if (path.oldPath != null) {
	                window.setTimeout(function () {
	                    return _this.addPath(path.oldPath);
	                }, 0);
                }
	        `);
            return lines;
        })
    };

    const inject = (full) => {
        const match_bootstrap = /^\/\*\*\*\*\*\*\/ \(\[$/g;
        const match_start = /(^\/\* [0-9]* \*\/$|^\/\*\*\*\*\*\*\/ \]\);$)/g;
        const match_end = /^\/\*\*\*\/ }\),?$/g;
        let pattern = match_bootstrap;
        let section_start;
        let section_number;
        return full.split(/\n/g).reduce((modules, line, index, lines) => {
            const matched = line.match(pattern);
            if(matched) {
                if(pattern === match_start) {
                    pattern = match_end;
                    section_start = index;
                    section_number = Number(matched[0].replace(/[/* ]/g,''));
                    if(isNaN(section_number)) {
                        // Tail
                        modules.push(lines.slice(section_start));
                    }
                } else if (pattern === match_end){
                    pattern = match_start;
                    modules.push(lines.slice(section_start, index + 1));
                } else if (pattern === match_bootstrap) {
                    pattern = match_start;
                    modules.push(lines.slice(0, index +1));
                }
            }
            return modules;
        }, []).map((module, index) => {
            const module_index = index - 1;
            if(mods[module_index] !== undefined) {
                log(`Injecting into module ${module_index}...`);
                module = mods[module_index](module);
            }
            return module;
        }).reduce((stack, module, index) => [...stack, ...module]).join("\n") + `\n//# sourceURL=/assets/bundle.js`;
    };

    const hijack = (() => {
        log("HAMMERTIME.");
        const body = document.createElement("body");
        const main = document.createElement("div");
        main.id = "main";
        main.classList.add("main");
        body.appendChild(main);
        const req = new XMLHttpRequest();
        req.open('GET', "/assets/bundle.js");
        req.onreadystatechange = function() {
            if (req.readyState == 4) {
                if (req.status == 200) {
                    log("ALL YOUR SCRIPT ARE BELONG TO US.");
                    try {
                        window.eval(inject(req.responseText));
                    } catch (e) {
                        log("Evaluation failed!", e);
                        alert("Script failed, reload the page to try again.");
                    }
                } else {
                    log(`SOMEBODY SET UP US THE ${req.status}.`);
                    alert("Could not obtain script, reload the page to try again.");
                }
            }
        };
        req.send();
        document.querySelector('html').appendChild(body);
    })();

})();

