<?php

setlocale(LC_ALL,"spanish");

date_default_timezone_set('America/Caracas');

mysql_query("SET NAMES 'utf8'");

mysql_set_charset('utf8');

session_start();

class Conexion
{
	private $conex;

	function __construct()
	{
		$this->conex=mysql_connect("localhost", "root","")    
		or die("ERROR: No se pudo realizar la conexion a la base de datos.");   
		
		mysql_select_db("cai",$this->conex)
		or die("ERROR: No se pudo selecionar la base de datos");		
	}

	public function getConex()
	{
	    return $this->conex;
	}
	
	public function setConex($conex)
	{
	    $this->conex = $conex;
	    return $this;
	}
	public function cerrar_conexion()
	{
		mysql_close($this->conex);
	}
}

class Session 
{
	public function cerrar_session (){
		
		if ($_SESSION)	{	
			session_destroy();
			echo '<script language = javascript>
			self.location = "../index.php"
			</script>';}
		else {
			echo '<script language = javascript>
			alert("No ha iniciado ninguna sesion, por favor registrese")
			self.location = "../vista/index.php"
			</script>';}
	}
}

class Consulta
{
	public function sqla ($conex, $consulta)
	{
		$resultado= mysql_query($consulta,$conex) or die (mysql_error());
		$fila=mysql_fetch_array($resultado);
		return $fila;
	}
	public function sqlo ($conex, $consulta)
	{
		$resultado= mysql_query($consulta,$conex) or die (mysql_error());
		return $resultado;
	}
}

class Usuario extends Consulta
{
	public function autenticar_ingreso()
	{
		if (!$_SESSION){
			echo '<script language = javascript>
			alert("Usuario no autenticado")
			self.location = "../index.php"
			</script>';
		}
	}

	public function login_usuario($conex, $correo, $clave)
	{
		$clave = sha1($clave);
		$consulta= "SELECT * FROM usuarios WHERE correo='".$correo."' AND clave='".$clave."'"; 
		$fila= $this->sqla($conex, $consulta);
		
		if (!$fila[0]) 
		{
			echo '<div class="alert alert-danger text-center" role="alert"><b>Correo y/o clave errados, por favor verifique sus datos.</b></div>';
		}
		else 
		{
			$_SESSION['id_usuario'] = $fila['id_usuario'];
			$_SESSION['nombre'] = $fila['nombre'];
			$_SESSION['apellido'] = $fila['apellido'];
			$_SESSION['correo'] = $fila['correo'];
			$_SESSION['rol'] = $fila['rol'];

			
			switch ($fila['rol']) {
				case 1:
				echo '<script language = javascript>
					self.location = "../vista/administrador/index.php"
					</script>';
				break;
				case 2:
				echo '<script language = javascript>
					self.location = "../vista/empleado/index.php"
					</script>';
				break;
				case 3:
				echo '<script language = javascript>
					self.location = "../vista/seguridad/index.php"
					</script>';
				break;
				
				default:
				exit('Permiso no concedido, contacte al administrador.');
				break;
			}
		}
	}

	public function registrar_perfil($conex, $id_usuario)
	{
		$clave = sha1($_POST['clave']);
		$actualizar= "UPDATE usuarios SET `cargo`= '$_POST[cargo]', `departamento`= '$_POST[departamento]', `correo`= '$_POST[correo]',  `telefono_movil`= '$_POST[telefono_movil]', `telefono_fijo`= '$_POST[telefono_fijo]', `clave`= '$clave' WHERE `id_usuario` ='".$id_usuario."'";
		
		mysql_query($actualizar,$conex) or die (mysql_error());

		echo '<script language = javascript>
					alert("Datos guardados exitosamente.");
					self.location = "../index.php";
			</script>';
	}

	public function modificar_perfil($conex, $id_usuario)
	{
		$clave = sha1($_POST['clave']);
		$actualizar= "UPDATE usuarios SET `cargo`= '$_POST[cargo]', `departamento`= '$_POST[departamento]', `correo`= '$_POST[correo]',  `telefono_movil`= '$_POST[telefono_movil]', `telefono_fijo`= '$_POST[telefono_fijo]', `clave`= '$clave' WHERE `id_usuario` ='".$id_usuario."'";
		// PARA MODIFICACION COMPLETA AÑADIR: `cedula`= '$_POST[cedula]', `nombre`= '$_POST[nombre]', `apellido`= '$_POST[apellido]',
		mysql_query($actualizar,$conex) or die (mysql_error());

		switch ($_SESSION['rol']) {
			case 1:
			echo '<script language = javascript>
					alert("Datos guardados exitosamente.");
					self.location = "../vista/administrador/index.php";
				</script>';
			break;
			case 2:
			echo '<script language = javascript>
					alert("Datos guardados exitosamente.");
					self.location = "../vista/empleado/index.php";
				</script>';
			break;
			case 3:
			echo '<script language = javascript>
					alert("Datos guardados exitosamente.");
					self.location = "../vista/seguridad/index.php";
				</script>';
			break;
			
			default:
			exit('Permiso no concedido, contacte al administrador.');
			break;
		}
	}

	public function modificar_empleado($conex, $id_usuario)
	{
		$actualizar= "UPDATE usuarios SET `cedula`= '$_POST[cedula]', `nombre`= '$_POST[nombre]', `apellido`= '$_POST[apellido]', `cargo`= '$_POST[cargo]', `departamento`= '$_POST[departamento]', `correo`= '$_POST[correo]',  `telefono_movil`= '$_POST[telefono_movil]', `telefono_fijo`= '$_POST[telefono_fijo]', `rol`= '$_POST[rol]' WHERE `id_usuario` ='".$id_usuario."'";

		mysql_query($actualizar,$conex) or die (mysql_error());

		echo '<script language = javascript>
					alert("Datos guardados exitosamente.");
					self.location = "../vista/administrador/empleados.php";
			</script>';
	}

	public function crear_empleado($conex)
	{
		$insertar= "INSERT INTO usuarios (`rol`, `cedula`, `nombre`, `apellido`, `cargo`, `departamento`, `correo`, `telefono_movil`, `telefono_fijo`) VALUES ('$_POST[rol]', '$_POST[cedula]', '$_POST[nombre]','$_POST[apellido]', '$_POST[cargo]', '$_POST[departamento]', '$_POST[correo]', '$_POST[telefono_movil]','$_POST[telefono_fijo]')";

		mysql_query($insertar,$conex) or die (mysql_error());

		echo '<script language = javascript>
				alert("Datos guardados exitosamente.");
				self.location = "../vista/administrador/crear_empleado.php";
			</script>';		
	}

	public function eliminar_empleado($conex, $id_usuario)
	{
		$eliminar= "DELETE FROM usuarios WHERE `id_usuario` = '".$id_usuario."'";

		mysql_query($eliminar,$conex) or die (mysql_error());

		echo '<script language = javascript>
				self.location = "../vista/administrador/empleados.php";
			</script>';
	}

	public function usuario_por_cedula($conex, $cedula)
	{
		$consulta= "SELECT * FROM usuarios WHERE usuarios.cedula= '".$cedula."'";
		return $this->sqla($conex, $consulta);
	}

	public function usuario_por_correo($conex, $correo)
	{
		$consulta= "SELECT * FROM usuarios WHERE usuarios.correo= '".$correo."'";
		return $this->sqla($conex, $consulta);
	}

	public function actualizar_clave($conex, $clave, $correo)
	{
		$actualizar= "UPDATE usuarios SET `clave` = '$clave' WHERE `correo` = '$correo'";
		mysql_query($actualizar,$conex) or die (mysql_error());
	}

	public function datos_usuario($conex, $id_usuario)
	{
		$consulta= "SELECT * FROM usuarios WHERE id_usuario='".$id_usuario."'"; 
		return $this->sqla($conex, $consulta);
	}

	public function obtener_usuarios($conex)
	{
		$consulta= "SELECT * FROM usuarios ORDER BY `id_usuario` DESC"; 
		return $this->sqlo($conex, $consulta);
	}
}

class Invitado extends Consulta
{
	public function datos_invitado($conex, $id_invitado)
	{
		$consulta= "SELECT * FROM invitados, usuarios WHERE invitados.id_invitado='".$id_invitado."' AND invitados.id_anfitrion = usuarios.id_usuario"; 
		return $this->sqla($conex, $consulta);
	}

	public function obtener_invitados($conex)
	{
		$consulta= "SELECT * FROM invitados ORDER BY `id_invitado` DESC LIMIT 0,20"; 
		return $this->sqlo($conex, $consulta);
	}

	public function obtener_invitados_a($conex)
	{
		$consulta= "SELECT * FROM invitados"; 
		return $this->sqla($conex, $consulta);
	}
	
	public function obtener_invitados_hoy($conex)
	{
		$consulta= "SELECT invitados.id_invitado, invitados.cedula_invitado, invitados.nombre_invitado, invitados.apellido_invitado, invitados.fecha, usuarios.nombre, usuarios.apellido FROM invitados, usuarios WHERE fecha= CURDATE() AND retiro IS NULL AND invitados.id_anfitrion = usuarios.id_usuario ORDER BY `id_invitado` DESC"; 
		return $this->sqlo($conex, $consulta);
	}

	public function obtener_invitados_hoy_a($conex)
	{
		$consulta= "SELECT * FROM invitados WHERE fecha= CURDATE() AND retiro IS NULL"; 
		return $this->sqla($conex, $consulta);
	}

	public function invitados_por_cedula_a($conex, $cedula)
	{
		$consulta= "SELECT * FROM invitados WHERE invitados.cedula_invitado= '".$cedula."'";
		return $this->sqla($conex, $consulta);
	}

	public function invitados_por_cedula_o($conex, $cedula)
	{
		$consulta= "SELECT * FROM invitados WHERE invitados.cedula_invitado= '".$cedula."' ORDER BY `id_invitado` DESC";
		return $this->sqlo($conex, $consulta);
	}

	public function invitados_por_cedula_a_hoy($conex, $cedula)
	{
		$consulta= "SELECT * FROM invitados WHERE invitados.cedula_invitado= '".$cedula."' AND fecha= CURDATE() AND retiro IS NULL";
		return $this->sqla($conex, $consulta);
	}

	public function invitados_por_cedula_o_hoy($conex, $cedula)
	{
		$consulta= "SELECT invitados.id_invitado, invitados.cedula_invitado, invitados.nombre_invitado, invitados.apellido_invitado, invitados.fecha, usuarios.nombre, usuarios.apellido FROM invitados, usuarios WHERE invitados.cedula_invitado= '".$cedula."' AND fecha= CURDATE() AND retiro IS NULL AND invitados.id_anfitrion = usuarios.id_usuario ORDER BY `id_invitado` DESC";
		return $this->sqlo($conex, $consulta);
	}

	public function invitados_por_empleado_a($conex, $id_anfitrion)
	{
		$consulta= "SELECT * FROM invitados WHERE id_anfitrion= '".$id_anfitrion."'";
		return $this->sqla($conex, $consulta);
	}

	public function invitados_por_empleado_o($conex, $id_anfitrion)
	{
		$consulta= "SELECT * FROM invitados WHERE id_anfitrion= '".$id_anfitrion."' ORDER BY `id_invitado` DESC";
		return $this->sqlo($conex, $consulta);
	}

	public function invitados_por_cedula_empleado_a($conex, $cedula_invitado, $id_anfitrion)
	{
		$consulta= "SELECT * FROM invitados WHERE cedula_invitado= '".$cedula_invitado."' AND id_anfitrion= '".$id_anfitrion."'";
		return $this->sqla($conex, $consulta);
	}

	public function invitados_por_cedula_empleado_o($conex, $cedula_invitado, $id_anfitrion)
	{
		$consulta= "SELECT * FROM invitados WHERE cedula_invitado= '".$cedula_invitado."' AND id_anfitrion= '".$id_anfitrion."' ORDER BY `id_invitado` DESC";
		return $this->sqlo($conex, $consulta);
	}

	public function crear_invitado($conex)
	{
		$insertar= "INSERT INTO invitados (`id_anfitrion`, `cedula_invitado`, `nombre_invitado`, `apellido_invitado`, `placa`, `telefono_movil_invitado`, `telefono_fijo_invitado`, `fecha`) VALUES ('$_POST[id_anfitrion]', '$_POST[cedula_invitado]', '$_POST[nombre_invitado]','$_POST[apellido_invitado]', '$_POST[placa]', '$_POST[telefono_movil_invitado]','$_POST[telefono_fijo_invitado]', CURDATE())";

		mysql_query($insertar,$conex) or die (mysql_error());

		echo '<script language = javascript>
				alert("Datos guardados exitosamente.");
				self.location = "../vista/empleado/crear_invitado.php";
			</script>';		
	}

	public function modificar_invitado($conex, $id_invitado)
	{
		$actualizar= "UPDATE invitados SET `cedula_invitado`= '$_POST[cedula_invitado]', `nombre_invitado`= '$_POST[nombre_invitado]', `apellido_invitado`= '$_POST[apellido_invitado]', `placa`= '$_POST[placa]', `telefono_movil_invitado`= '$_POST[telefono_movil_invitado]', `telefono_fijo_invitado`= '$_POST[telefono_fijo_invitado]' WHERE `id_invitado` ='".$id_invitado."'";

		mysql_query($actualizar,$conex) or die (mysql_error());

		echo '<script language = javascript>
					alert("Datos guardados exitosamente.");
					self.location = "../vista/empleado/historial.php";
			</script>';
	}

	public function eliminar_invitado($conex, $id_invitado)
	{
		$eliminar= "DELETE FROM invitados WHERE `id_invitado` = '".$id_invitado."'";

		mysql_query($eliminar,$conex) or die (mysql_error());

		echo '<script language = javascript>
				self.location = "../vista/empleado/historial.php";
			</script>';
	}

	public function hora_entrada($conex, $id_invitado, $hora_entrada)
	{
		$actualizar= "UPDATE invitados SET `hora_entrada`= '$hora_entrada', `estatus`= 'Permitido' WHERE `id_invitado` ='".$id_invitado."'";

		mysql_query($actualizar,$conex) or die (mysql_error());

		echo '<script language = javascript>
				self.location = "../vista/seguridad/lista_invitados.php";
			</script>';
	}

	public function hora_salida($conex, $id_invitado, $hora_salida)
	{
		$actualizar= "UPDATE invitados SET `hora_salida`= '$hora_salida', `retiro`= 1 WHERE `id_invitado` ='".$id_invitado."'";

		mysql_query($actualizar,$conex) or die (mysql_error());

		echo '<script language = javascript>
				self.location = "../vista/seguridad/lista_invitados.php";
			</script>';
	}

	public function denegar_acceso($conex, $id_invitado, $observacion)
	{
		$actualizar= "UPDATE invitados SET `observacion`= '$observacion', `estatus`= 'Denegado', `retiro`= 1 WHERE `id_invitado` ='".$id_invitado."'";

		mysql_query($actualizar,$conex) or die (mysql_error());

		echo '<script language = javascript>
				self.location = "../vista/seguridad/lista_invitados.php";
			</script>';
	}
}

class Noticia extends Consulta
{
	public function datos_noticia($conex, $id_noticia)
	{
		$consulta= "SELECT * FROM noticias WHERE id_noticia='".$id_noticia."'"; 
		return $this->sqla($conex, $consulta);
	}

	public function obtener_noticias_a($conex)
	{
		$consulta= "SELECT * FROM noticias"; 
		return $this->sqla($conex, $consulta);
	}

	public function obtener_noticias_o($conex)
	{
		$consulta= "SELECT * FROM noticias ORDER BY `id_noticia` DESC"; 
		return $this->sqlo($conex, $consulta);
	}

	public function crear_noticia_imagen($conex, $imagen)
	{
		$insertar= "INSERT INTO noticias (`titulo`, `contenido`, `imagen`, `fecha`) VALUES ('$_POST[titulo]', '$_POST[contenido]', '$imagen', CURDATE())";

		mysql_query($insertar,$conex) or die (mysql_error());
	}

	public function crear_noticia($conex)
	{
		$insertar= "INSERT INTO noticias (`titulo`, `contenido`, `fecha`) VALUES ('$_POST[titulo]', '$_POST[contenido]', CURDATE())";

		mysql_query($insertar,$conex) or die (mysql_error());
	}

	public function modificar_noticia_imagen($conex, $id_noticia, $imagen)
	{
		$actualizar= "UPDATE noticias SET `titulo`= '$_POST[titulo]', `contenido`= '$_POST[contenido]', `imagen`= '$imagen', `fecha`= CURDATE() WHERE `id_noticia` ='".$id_noticia."'";

		mysql_query($actualizar,$conex) or die (mysql_error());

		echo '<script language = javascript>
					self.location = "../vista/administrador/noticias.php";
			</script>';
	}

	public function modificar_noticia($conex, $id_noticia)
	{
		$actualizar= "UPDATE noticias SET `titulo`= '$_POST[titulo]', `contenido`= '$_POST[contenido]', `fecha`= CURDATE() WHERE `id_noticia` ='".$id_noticia."'";

		mysql_query($actualizar,$conex) or die (mysql_error());

		echo '<script language = javascript>
					self.location = "../vista/administrador/noticias.php";
			</script>';
	}

	public function eliminar_noticia($conex, $id_noticia)
	{
		$eliminar= "DELETE FROM noticias WHERE `id_noticia` = '".$id_noticia."'";

		mysql_query($eliminar,$conex) or die (mysql_error());

		echo '<script language = javascript>
				self.location = "../vista/administrador/noticias.php";
			</script>';
	}
}

?>