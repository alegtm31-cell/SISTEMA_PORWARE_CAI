<?php  

$dias = array("Domingo","Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sabado");

$meses =array("","Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre");

echo '<p class="text-right" style="margin-right: 50px;"><span class="fa fa-calendar-check-o fa-2x"></span>  '.$dias[date("w")].', '.date("d").' de '.$meses[date("n")].' del '.date("Y").'</p>';

?>