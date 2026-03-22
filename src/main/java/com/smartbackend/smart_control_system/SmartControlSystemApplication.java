
package com.smartbackend.smart_control_system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SmartControlSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(SmartControlSystemApplication.class, args);
	}

}
