/*
 * Copyright by Vinicius Isola, 2010
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */
package br.com.depasser.jsservlet;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.Socket;
import java.util.Properties;

public class Shutdown {

	public static void main(String[] args) throws Exception {
		BufferedReader in = new BufferedReader(new InputStreamReader(System.in));

		Properties defaults = new Properties();
		defaults.load(Shutdown.class.getResourceAsStream("default.properties"));

		int port = Integer.parseInt(defaults.getProperty("server.shutdown.port", "65000"));
		String password = defaults.getProperty("server.shutdown.password", "");

		System.out.println("Press enter to use (default)...");

		String server = "localhost";
		System.out.print("Server (" + server + "): ");

		String sServer = in.readLine();
		if (sServer != null && ! sServer.trim().equals("")) {
			server = sServer;
		}

		System.out.print("Port (" + port + "): ");

		String sPort = in.readLine();
		if (sPort != null && ! sPort.trim().equals("")) {
			port = Integer.parseInt(sPort);
		}

		System.out.print("Password (" + password + "): ");
		String sPassword = in.readLine();
		if (sPassword != null && ! sPassword.trim().equals("")) {
			password = sPassword;
		}


		Socket socket = new Socket(server, port);

		BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream()));
		writer.write(password);
		writer.write("\n");
		writer.flush();

		BufferedReader serverIn = new BufferedReader(new InputStreamReader(socket.getInputStream()));
		String answer = serverIn.readLine();

		socket.close();

		if (answer.equals("OK")) {
			System.out.println("Shutting down server...");
		} else {
			System.out.println("Server answer: " + answer);
		}
	}

}