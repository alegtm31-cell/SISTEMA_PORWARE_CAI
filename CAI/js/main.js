function validar_login(correo, clave){

    var parametros = {
        "correo" : correo,
        "clave" : clave
    };

    $.ajax({
        data:  parametros,
        url:   '../controlador/acceso.php',
        type:  'post',
        success:  function (response) {
            $("#resultado_login_invalido").html(response);
        }
    });
}

function validar_cedula(cedula){

    var cedula = cedula;
    if (cedula.length < 7){
    $("#resultado_cedula_invalida").html('<div class="alert alert-danger text-center" role="alert"><b>La cedula debe tener un minimo de 7 digitos, por favor verifique sus datos.</b></div>');
    document.getElementById("cedula_valida").focus();
    }
    else {

        var parametros = {
            "cedula" : cedula
        };

        $.ajax({
            data:  parametros,
            url:   '../controlador/registro_usuarios.php',
            type:  'post',
            success:  function (response) {
                $("#resultado_cedula_invalida").html(response);
            }
        });
    }
}

function validar_correo(correo){

    var parametros = {
        "correo" : correo
    };

    $.ajax({
        data:  parametros,
        url:   '../controlador/recuperar_clave.php',
        type:  'post',
        beforeSend: function () {
            $("#resultado_correo_invalido").html('<p class="msg-azul">Procesando, espere por favor...</p>');
        },
        success:  function (response) {
            $("#resultado_correo_invalido").html(response);
        }
    });
}


function validar_registro_usuario(){

    var telefono_movil = document.getElementById("telefono_movil").value;
    if (telefono_movil.length < 11){
        alert('El numero de telefono debe tener un minimo de 11 caracteres, por favor verifique sus datos.');
        document.getElementById("telefono_movil").focus();
        return false;
    }

    
    if (document.getElementById("telefono_fijo").value.length > 0) {
        if (document.getElementById("telefono_fijo").value.length < 11){
            alert('El numero de telefono debe tener un minimo de 11 caracteres, por favor verifique sus datos.');
            document.getElementById("telefono_fijo").focus();
        return false;
        }
    }

    var clave = document.getElementById("clave").value;
    if (clave.length < 6){
        alert('La clave debe tener un minimo de 6 caracteres, por favor verifique sus datos.');
        document.getElementById("clave").focus();
        return false;
    }

    if(document.getElementById("clave").value != document.getElementById("clave2").value){
        alert('Las claves no coinciden, por favor verifique sus datos.');
        document.getElementById("clave").focus();
        return false;
    }

    return true;
}

function validar_registro_empleado(){

    var cedula = document.getElementById("cedula").value;
    if (cedula.length < 7){
        alert('La cedula debe tener un minimo de 7 digitos, por favor verifique sus datos.');
        document.getElementById("cedula").focus();
        return false;
    }

    if (document.getElementById("telefono_movil").value.length > 0) {
        if (document.getElementById("telefono_movil").value.length < 11){
            alert('El numero de telefono debe tener un minimo de 11 caracteres, por favor verifique sus datos.');
            document.getElementById("telefono_movil").focus();
        return false;
        }
    }
    
    if (document.getElementById("telefono_fijo").value.length > 0) {
        if (document.getElementById("telefono_fijo").value.length < 11){
            alert('El numero de telefono debe tener un minimo de 11 caracteres, por favor verifique sus datos.');
            document.getElementById("telefono_fijo").focus();
        return false;
        }
    }

    if(document.getElementById("rol").value == 0){
        alert('Debe seleccionar un rol valido, por favor verifique sus datos.');
        document.getElementById("rol").focus();
        return false;
    }

    return true;
}

function validar_modificar_invitado(){

    var cedula = document.getElementById("cedula_invitado").value;
    if (cedula.length < 7){
        alert('La cedula debe tener un minimo de 7 digitos, por favor verifique sus datos.');
        document.getElementById("cedula_invitado").focus();
        return false;
    }

    if (document.getElementById("telefono_movil_invitado").value.length > 0) {
        if (document.getElementById("telefono_movil_invitado").value.length < 11){
            alert('El numero de telefono debe tener un minimo de 11 caracteres, por favor verifique sus datos.');
            document.getElementById("telefono_movil_invitado").focus();
        return false;
        }
    }
    
    if (document.getElementById("telefono_fijo_invitado").value.length > 0) {
        if (document.getElementById("telefono_fijo_invitado").value.length < 11){
            alert('El numero de telefono debe tener un minimo de 11 caracteres, por favor verifique sus datos.');
            document.getElementById("telefono_fijo_invitado").focus();
        return false;
        }
    }

    return true;
}

function buscar_cedula(cedula){

    var cedula = cedula;
    if (cedula.length < 7){
    $("#resultado_buscar_cedula").html('<div class="alert alert-danger text-center" role="alert"><b>La cedula debe tener un minimo de 7 digitos, por favor verifique sus datos.</b></div>');
    document.getElementById("cedula_buscar").focus();
    }
    else {

        var parametros = {
            "cedula" : cedula
        };

        $.ajax({
            data:  parametros,
            url:   '../../controlador/buscar_cedula.php',
            type:  'post',
            beforeSend: function () {
            $("#resultado_buscar_cedula").html('<p class="msg-azul">Buscando, espere por favor...</p>');
            },
            success:  function (response) {
                $("#resultado_buscar_cedula").html(response);
            }
        });
    }
}

function buscar_cedula_invitado(cedula){

    var cedula = cedula;
    if (cedula.length < 7){
    $("#resultado_buscar_cedula_invitado").html('<div class="alert alert-danger text-center" role="alert"><b>La cedula debe tener un minimo de 7 digitos, por favor verifique sus datos.</b></div>');
    document.getElementById("cedula_buscar_invitado").focus();
    }
    else {

        var parametros = {
            "cedula_invitado" : cedula
        };

        $.ajax({
            data:  parametros,
            url:   '../../controlador/buscar_cedula_invitado.php',
            type:  'post',
            beforeSend: function () {
            $("#resultado_buscar_cedula_invitado").html('<p class="msg-azul">Buscando, espere por favor...</p>');
            },
            success:  function (response) {
                $("#resultado_buscar_cedula_invitado").html(response);
            }
        });
    }
}

function buscar_cedula_invitado_por_empleado(cedula){

    var cedula = cedula;
    if (cedula.length < 7){
    $("#resultado_buscar_cedula_invitado_por_empleado").html('<div class="alert alert-danger text-center" role="alert"><b>La cedula debe tener un minimo de 7 digitos, por favor verifique sus datos.</b></div>');
    document.getElementById("cedula_buscar_invitado_por_empleado").focus();
    }
    else {

        var parametros = {
            "cedula_invitado" : cedula
        };

        $.ajax({
            data:  parametros,
            url:   '../../controlador/buscar_cedula_invitado_por_empleado.php',
            type:  'post',
            beforeSend: function () {
            $("#resultado_buscar_cedula_invitado_por_empleado").html('<p class="msg-azul">Buscando, espere por favor...</p>');
            },
            success:  function (response) {
                $("#resultado_buscar_cedula_invitado_por_empleado").html(response);
            }
        });
    }
}

function buscar_cedula_invitado_por_seguridad(cedula){

    var cedula = cedula;
    if (cedula.length < 7){
    $("#resultado_buscar_cedula_invitado_por_seguridad").html('<div class="alert alert-danger text-center" role="alert"><b>La cedula debe tener un minimo de 7 digitos, por favor verifique sus datos.</b></div>');
    document.getElementById("cedula_buscar_invitado_por_seguridad").focus();
    }
    else {

        var parametros = {
            "cedula_invitado" : cedula
        };

        $.ajax({
            data:  parametros,
            url:   '../../controlador/buscar_cedula_invitado_por_seguridad.php',
            type:  'post',
            beforeSend: function () {
            $("#resultado_buscar_cedula_invitado_por_seguridad").html('<p class="msg-azul">Buscando, espere por favor...</p>');
            },
            success:  function (response) {
                $("#resultado_buscar_cedula_invitado_por_seguridad").html(response);
            }
        });
    }
}

function permite(elEvento, permitidos) {
    // Variables que definen los caracteres permitidos
    var numeros = "0123456789";
    var caracteres = " abcdefghijklmnñopqrstuvwxyzABCDEFGHIJKLMNÑOPQRSTUVWXYZ_-.@";
    var numeros_caracteres = numeros + caracteres;
    var teclas_especiales = [8, 9, 13, 16, 18, 39];
    // 8 = BackSpace, 46 = punto, 39 = flecha derecha
    //var teclas_especiales = [8, 9, 13, 16, 18, 37, 39, 46, 64];
   
    // Seleccionar los caracteres a partir del parámetro de la función
    switch(permitidos) {
        case 'num':
            permitidos = numeros;
            break;
        case 'car':
            permitidos = caracteres;
            break;
        case 'num_car':
            permitidos = numeros_caracteres;
            break;
    }
   
    // Obtener la tecla pulsada 
    var evento = elEvento || window.event;
    var codigoCaracter = evento.charCode || evento.keyCode;
    var caracter = String.fromCharCode(codigoCaracter);
   
    // Comprobar si la tecla pulsada es alguna de las teclas especiales
    // (teclas de borrado y flechas horizontales)
    var tecla_especial = false;
    for(var i in teclas_especiales) {
        if(codigoCaracter == teclas_especiales[i]) {
            tecla_especial = true;
            break;
        }
    }
   
    // Comprobar si la tecla pulsada se encuentra en los caracteres permitidos o si es una tecla especial
    
    return permitidos.indexOf(caracter) != -1 || tecla_especial;
}

$(document).ready(function() { 

    $('#form-login').submit(function(){ 
        event.preventDefault();
        validar_login($('#correo_login').val(), $('#clave_login').val()); 
    });

    $('#form-cedula').submit(function(){ 
        event.preventDefault();
        validar_cedula($('#cedula_valida').val()); 
    });

    $('#form-correo').submit(function(){ 
        event.preventDefault();
        validar_correo($('#correo_recupera').val()); 
    });

     $('#form-cedula-buscar').submit(function(){ 
        event.preventDefault();
        buscar_cedula($('#cedula_buscar').val()); 
    });
 
    $('#form-cedula-buscar-invitado').submit(function(){ 
        event.preventDefault();
        buscar_cedula_invitado($('#cedula_buscar_invitado').val()); 
    });

    $('#form-cedula-buscar-invitado-por-empleado').submit(function(){ 
        event.preventDefault();
        buscar_cedula_invitado_por_empleado($('#cedula_buscar_invitado_por_empleado').val()); 
    });    

    $('#form-cedula-buscar-invitado-por-seguridad').submit(function(){ 
        event.preventDefault();
        buscar_cedula_invitado_por_seguridad($('#cedula_buscar_invitado_por_seguridad').val()); 
    });  

 });