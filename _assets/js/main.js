var app_id = "app_id=ee84c96b";
var app_key = "app_key=3aa60311a1e7234f876e281f65056dbe";
var map;
var zoom = 10;
var london = {lat: 51.5286416, lng: -0.1015987};
var data_formatted = [];
var current_year = new Date().getFullYear();
var stats = [];
var markers = [];
var oms;
var marker_cluster;

function init_map() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: zoom,
        center: london
    });
}

function set_map_on_all(map) {
    $.each(markers, function(key, marker) {
        marker.setMap(map);
    });
}

function clear_markers() {
    set_map_on_all(null);
}

function show_markers() {
    set_map_on_all(map);
}

function delete_markers() {
    clear_markers();
    markers = [];
}

function add_copyright() {
    var copyright = document.createElement('div');
    copyright.id = "copyright";

    var copyright_content = document.createElement('div');
    copyright_content.id = "copyright-content";
    copyright_content.innerHTML =
        "<span>Copyright &copy; " + current_year +
        "<a href='http://sergiu-tripon.com/' target='_blank'> Sergiu Tripon</a></span>" +
        "<span class='hidden-xs'>. Code licensed under " +
        "<a href='" + license_path + "' target='_blank'>MIT License</a>.</span>"
    ;
    copyright.appendChild(copyright_content);

    copyright.index = -1;
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(copyright);
}

function add_year_control(year_to_remove) {
    $("#map").append("<div id='control-year' class='control-custom'>" + year_to_remove +"</div>");
    var control_year = $("#control-year");
    control_year.index(1);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(control_year[0]);

    var modal_year = $("#modal-year");
    var modal_content_year = "<div class='modal-dialog modal-md' role='document'>";
    modal_content_year +=
        "<div class='modal-content'>" +
        "<div class='modal-header' style='background-color: #EC7063'>" +
        "<button type='button' class='close' data-dismiss='modal' aria-label='Close'>" +
        "<span class='fa fa-times' aria-hidden='true'></span>" +
        "</button>" +
        "<div class='container-fluid'>" +
        "<div class='row'>" +
        "<div class='col-lg-12'>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "<div class='modal-body' style='background-color: #45B39D'>" +
        "<div class='container-fluid'>" +
        "<div class='row'>" +
        "<div class='col-lg-12'>" +
        "<ul id='select-year' class='list-inline'>"
    ;
    for (var year = 2006; year <= current_year - 1; year++) {
        modal_content_year +=
            "<li id='" + year + "'>" +
            "<button type='button' class='btn btn-light'>" + year + "</button>" +
            "</li>"
        ;
    }
    modal_content_year +=
        "</ul>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "<div class='modal-footer' style='background-color: #EC7063'>" +
        "<div class='container-fluid'>" +
        "<div class='row'>" +
        "<div class='col-lg-12'>" +
        "<button type='button' class='btn btn-light btn-md' data-dismiss='modal'>" +
        "Close <i class='fa fa-times'></i>" +
        "</button>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>"
    ;
    modal_year.append(modal_content_year);
    $("#select-year #" + year_to_remove).remove();
}

function format_data(data) {
    $.each(data, function(key, val) {
        var data_temp = {};
        $.each(val, function(key, val) {
            data_temp[key] = val
        });
        data_formatted.push(data_temp);
    });
}

function get_iw_content(year) {
    var iw_content;
    $.each(data_formatted, function(key, val) {
        iw_content =
            "<h5>Accident - " + year + "</h5>" +
            "<div>" +
            "<b>Severity</b>: " + val.severity + "<br>" +
            "<b>Borough</b>: " + val.borough + "<br>" +
            "<b>Latitude</b>: " + val.lat + "<br>" +
            "<b>Longitude</b>: " + val.lon + "<br>" +
            "<b>Location</b>: " + val.location + "<br>" +
            "<b>Total casualties</b>: " + val.casualties.length + "<br>" +
            "<b>Total vehicles</b>: " + val.vehicles.length + "<br>" +
            "</div>" +
            "<hr>"
        ;
        if (val.casualties.length > 1) {
            iw_content += "<h5>Casualties</h5>";
            $.each(val.casualties, function(key, val) {
                iw_content +=
                    "<div>" +
                    "<h5>Casualty " + (key + 1) + "</h5>" +
                    "<b>Age</b>: " + val.age + "<br>" +
                    "<b>Class</b>: " + val.class + "<br>" +
                    "<b>Severity</b>: " + val.severity + "<br>" +
                    "<b>Mode</b>: " + val.mode + "<br>" +
                    "<b>Age Band</b>: " + val.ageBand + "<br>" +
                    "</div>"
                ;
            });
        } else {
            iw_content +=
                "<h5>Casualty</h5>" +
                "<div>" +
                "<b>Age</b>: " + val.casualties[0].age + "<br>" +
                "<b>Class</b>: " + val.casualties[0].class + "<br>" +
                "<b>Severity</b>: " + val.casualties[0].severity + "<br>" +
                "<b>Mode</b>: " + val.casualties[0].mode + "<br>" +
                "<b>Age Band</b>: " + val.casualties[0].ageBand + "<br>" +
                "</div>"
            ;
        }
        iw_content += "<hr>";
        if (val.vehicles.length > 1) {
            iw_content += "<h5>Vehicles</h5>";
            $.each(val.vehicles, function(key, val) {
                iw_content +=
                    "<div>" +
                    "<h5>Vehicle " + (key + 1) + "</h5>" +
                    "<b>Type</b>: " + val.type + "<br>" +
                    "</div>"
                ;
            });
        } else {
            iw_content +=
                "<h5>Vehicle</h5>" +
                "<div>" +
                "<b>Type</b>: " + val.vehicles[0].type + "<br>" +
                "</div>"
            ;
        }
        data_formatted[key].iw_content = iw_content;
    });
}

function create_markers(year) {
    oms =  new OverlappingMarkerSpiderfier(map, {
        keepSpiderfied: true
    });
    $.each(data_formatted, function(key, val) {
        var marker = new google.maps.Marker({
            title: "Year: " + year + ", Location: " + val.location + ", Casualties: " + val.casualties.length + ", Vehicles: " + val.vehicles.length,
            position: {lat: val.lat, lng: val.lon},
            category: val.severity,
            iw_content: val.iw_content
        });
        markers.push(marker);
        oms.addMarker(marker);
    });

    var iw = new google.maps.InfoWindow();
    oms.addListener('click', function(marker, event) {
        iw.setContent(marker.iw_content);
        iw.open(map, marker);
    });
    oms.addListener('spiderfy', function(markers) {
        iw.close();
    });

    marker_cluster = new MarkerClusterer(map, markers,
        {imagePath: mc_image_path}
    );
    marker_cluster.setMaxZoom(15);
}

function count_entities(entity) {
    var counts = {};
    $.each(entity, function(key, val) {
        if (counts[entity[key]]) {
            counts[entity[key]]++;
        }
        else {
            counts[entity[key]] = 1;
        }
    });
    return counts;
}

function get_stats() {
    var boroughs = [];
    var severities = [];
    var age1 = 0;
    var age2 = 0;
    var age3 = 0;
    var age4 = 0;
    var age5 = 0;
    var modes = [];
    var classes = [];
    var age_bands = [];
    var total_casualties = 0;
    var types = [];
    var total_vehicles = 0;
    $.each(data_formatted, function(key, val) {
        severities.push((val.severity).toLowerCase());
        boroughs.push((val.borough).toLowerCase());
        $.each(val.casualties, function(key, val) {
            total_casualties += 1;
            if (0 <= val.age && val.age <= 14) {
                age1 += 1;
            } else if (15 <= val.age && val.age <= 24) {
                age2 += 1;
            } else if (25 <= val.age && val.age <= 54) {
                age3 += 1;
            } else if (55 <= val.age && val.age <= 64) {
                age4 += 1;
            } else if (65 <= val.age) {
                age5 += 1;
            }
            age_bands.push((val.ageBand));
            classes.push((val.class));
            modes.push((val.mode));
        });
        $.each(val.vehicles, function(key, val) {
            total_vehicles += 1;
            types.push(val.type);
        });
    });
    severities = count_entities(severities);
    age_bands = count_entities(age_bands);
    classes = count_entities(classes);
    modes = count_entities(modes);
    types = count_entities(types);
    boroughs = count_entities(boroughs);
    stats.push({
        accidents: {
            boroughs: boroughs,
            severities: severities,
            total: data_formatted.length
        },
        casualties: {
            ages: {
                age1: age1,
                age2: age2,
                age3: age3,
                age4: age4,
                age5: age5
            },
            modes: modes,
            classes: classes,
            ageBands: age_bands,
            total: total_casualties
        },
        vehicles: {
            types: types,
            total: total_vehicles
        }
    });
}

function add_stats_control(year) {
    $("#map").append("<div id='control-stats' class='control-custom'>Stats</div>");
    var control_stats = $("#control-stats");
    control_stats.index(1);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(control_stats[0]);

    var modal_stats = $("#modal-stats");
    var modal_content_stats = "<div class='modal-dialog modal-lg' role='document'>";
    modal_content_stats +=
        "<div class='modal-content'>" +
        "<div class='modal-header' style='background-color: #EC7063'>" +
        "<button type='button' class='close' data-dismiss='modal' aria-label='Close'>" +
        "<span class='fa fa-times' aria-hidden='true'></span>" +
        "</button>" +
        "<div class='container-fluid'>" +
        "<div class='row'>" +
        "<div class='col-lg-12'>" +
        "<h1>- London Accidents -<br>" + year + " Statistics</h1>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>"
    ;
    modal_content_stats +=
        "<div class='modal-body' style='background-color: #45B39D'>" +
        "<div class='container-fluid'>" +
        "<div class='row'>" +
        "<div class='col-lg-12'>"
    ;
    modal_content_stats +=
        "<div class='col-lg-12'>" +
        "<h2>Overall</h2>" +
        "</div>" +
        "<div class='col-sm-4 col-md-4 col-lg-4'>" +
        "<div class='item-stats'>" +
        "<h4>Accidents</h4>" +
        "<h4>" + stats[0].accidents.total.toLocaleString()  + "</h4>" +
        "</div>" +
        "</div>" +
        "<div class='col-sm-4 col-md-4 col-lg-4'>" +
        "<div class='item-stats'>" +
        "<h4>Casualties</h4>" +
        "<h4>" + stats[0].casualties.total.toLocaleString() + "</h4>" +
        "</div>" +
        "</div>" +
        "<div class='col-sm-4 col-md-4 col-lg-4'>" +
        "<div class='item-stats'>" +
        "<h4>Vehicles</h4>" +
        "<h4>" + stats[0].vehicles.total.toLocaleString() + "</h4>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "<hr>"
    ;
    modal_content_stats +=
        "<div class='modal-body' style='background-color: #5DADE2'>" +
        "<div class='container-fluid'>" +
        "<div class='row'>" +
        "<div class='col-lg-12'>" +
        "<div class='col-lg-12'>" +
        "<h2>Accidents</h2>" +
        "<h3>Severity</h3>" +
        "</div>"
    ;
    $.each(stats[0].accidents.severities, function(severity, number) {
        modal_content_stats +=
            "<div class='col-sm-4 col-md-4 col-lg-4'>" +
            "<div class='item-stats'>" +
            "<h4>" + severity + "</h4>" +
            "<h4>" + number.toLocaleString() + "</h4>" +
            "</div>" +
            "</div>"
        ;
    });
    modal_content_stats +=
        "<div class='col-lg-12'>" +
        "<h3>Borough</h3>" +
        "</div>"
    ;
    $.each(stats[0].accidents.boroughs, function(borough, number) {
        modal_content_stats +=
            "<div class='col-sm-4 col-md-4 col-lg-4'>" +
            "<div class='item-stats'>" +
            "<h4>" + borough + "</h4>" +
            "<h4>" + number.toLocaleString() + "</h4>" +
            "</div>" +
            "</div>"
        ;
    });
    modal_content_stats +=
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "<hr>"
    ;
    modal_content_stats +=
        "<div class='modal-body' style='background-color: #2ECC71'>" +
        "<div class='container-fluid'>" +
        "<div class='row'>" +
        "<div class='col-lg-12'>" +
        "<h2>Casualties</h2>" +
        "<h3>Age</h3>" +
        "</div>" +
        "<div class='col-sm-4 col-md-4 col-lg-4'>" +
        "<div class='item-stats'>" +
        "<h4>0-14</h4>" +
        "<h4>" + stats[0].casualties.ages.age1.toLocaleString() + "</h4>" +
        "</div>" +
        "</div>" +
        "<div class='col-sm-4 col-md-4 col-lg-4'>" +
        "<div class='item-stats'>" +
        "<h4>15-24</h4>" +
        "<h4>" + stats[0].casualties.ages.age2.toLocaleString() + "</h4>" +
        "</div>" +
        "</div>" +
        "<div class='col-sm-4 col-md-4 col-lg-4'>" +
        "<div class='item-stats'>" +
        "<h4>25-54</h4>" +
        "<h4>" + stats[0].casualties.ages.age3.toLocaleString() + "</h4>" +
        "</div>" +
        "</div>" +
        "<div class='col-sm-4 col-md-4 col-lg-4'>" +
        "<div class='item-stats'>" +
        "<h4>55-64</h4>" +
        "<h4>" + stats[0].casualties.ages.age4.toLocaleString() + "</h4>" +
        "</div>" +
        "</div>" +
        "<div class='col-sm-4 col-md-4 col-lg-4'>" +
        "<div class='item-stats'>" +
        "<h4>65+</h4>" +
        "<h4>" + stats[0].casualties.ages.age5.toLocaleString() + "</h4>" +
        "</div>" +
        "</div>" +
        "<div class='col-lg-12'>" +
        "<h3>Age Band</h3>" +
        "</div>"
    ;
    $.each(stats[0].casualties.ageBands, function(age_band, number) {
        modal_content_stats +=
            "<div class='col-sm-4 col-md-4 col-lg-4'>" +
            "<div class='item-stats'>" +
            "<h4>" + age_band + "</h4>" +
            "<h4>" + number.toLocaleString() + "</h4>" +
            "</div>" +
            "</div>"
        ;
    });
    modal_content_stats +=
        "<div class='col-lg-12'>" +
        "<h3>Class</h3>" +
        "</div>"
    ;
    $.each(stats[0].casualties.classes, function(tfl_class, number) {
        modal_content_stats +=
            "<div class='col-sm-4 col-md-4 col-lg-4'>" +
            "<div class='item-stats'>" +
            "<h4>" + tfl_class + "</h4>" +
            "<h4>" + number.toLocaleString() + "</h4>" +
            "</div>" +
            "</div>"
        ;
    });
    modal_content_stats +=
        "<div class='col-lg-12'>" +
        "<h3>Mode</h3>" +
        "</div>"
    ;
    $.each(stats[0].casualties.modes, function(mode, number) {
        modal_content_stats +=
            "<div class='col-sm-6 col-md-4 col-lg-4'>" +
            "<div class='item-stats'>" +
            "<h4>" + mode.split(/(?=[A-Z])/).join(" ") + "</h4>" +
            "<h4>" + number.toLocaleString() + "</h4>" +
            "</div>" +
            "</div>"
        ;
    });
    modal_content_stats +=
        "</div>" +
        "</div>" +
        "</div>" +
        "<hr>"
    ;
    modal_content_stats +=
        "<div class='modal-body' style='background-color: #F5B041'>" +
        "<div class='container-fluid'>" +
        "<div class='row'>" +
        "<div class='col-lg-12'>" +
        "<div class='col-lg-12'>" +
        "<h2>Vehicles</h2>" +
        "<h3>Type</h3>" +
        "</div>"
    ;
    $.each(stats[0].vehicles.types, function(type, number) {
        modal_content_stats +=
            "<div class='col-sm-6 col-md-4 col-lg-4'>" +
            "<div class='item-stats'>" +
            "<h4>" + type.split(/(?=[A-Z])/).join(" ") + "</h4>" +
            "<h4>" + number.toLocaleString() + "</h4>" +
            "</div>" +
            "</div>"
        ;
    });
    modal_content_stats +=
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>"
    ;
    modal_content_stats +=
        "<div class='modal-footer' style='background-color: #EC7063'>" +
        "<div class='container-fluid'>" +
        "<div class='row'>" +
        "<div class='col-lg-12'>" +
        "<button type='button' class='btn btn-light btn-md' data-dismiss='modal'>" +
        "Close <i class='fa fa-times'></i>" +
        "</button>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>"
    ;
    modal_stats.append(modal_content_stats);
}

function get_data(year) {
    $.ajax({
        url: "https://api.tfl.gov.uk/AccidentStats/" + year + "?" + "&" + app_id + "&" + app_key
    }).then(function(data) {
        format_data(data);
        get_iw_content(year);
        create_markers(year);
        get_stats();
        add_year_control(year);
        add_stats_control(year);
        $("#control-year").click(function () {
            $('#modal-year').modal('show');
        });
        $("#control-stats").click(function () {
            $('#modal-stats').modal('show');
        });
        $("#modal-year li button").click(function () {
            $('#modal-year').modal('hide');
            marker_cluster.clearMarkers();
            oms.clearMarkers();
            delete_markers();
            data_formatted = [];
            stats = [];
            $("#modal-stats .modal-dialog").remove();
            $("#modal-year .modal-dialog").remove();
            $("#control-stats").remove();
            $("#control-year").remove();
            var year_selected = $(this).text();
            Pace.restart();
            get_data(year_selected);
            map.setCenter(london);
            map.setZoom(zoom);
        });
    })
    .fail(function() {
        get_data((parseInt(year) + 1).toString());
    });
}

$(function() {
    init_map();
    add_copyright();
    get_data("2005");
});