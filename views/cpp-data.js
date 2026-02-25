// ═══════════════════════════════════════════════════════════════
// ARDUINO & ESP32 C++ CHALLENGE SIMULATOR – DATA & CONFIGURATION
// Blueprint | GIIS Robotics Club
// ═══════════════════════════════════════════════════════════════

window.CPP_SIM = {

  // ─── SCORING CONFIG ──────────────────────────────────────────
  config: {
    baseScore: 100,
    weights: { correctness: 0.6, efficiency: 0.2, structure: 0.1, time: 0.1 },
    bonuses: { firstAttempt: 20, noHints: 10, allEdgeCases: 15 },
    penalties: { hintUsed: 5, failedAttempt: 2, failThreshold: 3 },
    xpPerLevel: { 1:50, 2:50, 3:50, 4:100, 5:100, 6:100, 7:200, 8:200, 9:300, 10:500 },
    unlockReqs: {
      1:  { xp:0,    minAvg:0  },
      2:  { xp:80,   minAvg:70 },
      3:  { xp:200,  minAvg:70 },
      4:  { xp:350,  minAvg:70 },
      5:  { xp:550,  minAvg:70 },
      6:  { xp:800,  minAvg:70 },
      7:  { xp:1100, minAvg:70 },
      8:  { xp:1500, minAvg:70 },
      9:  { xp:1900, minAvg:70 },
      10: { xp:2400, minAvg:70 }
    },
    timeBonusThresholds: [
      { seconds: 60,  multiplier: 1.5 },
      { seconds: 120, multiplier: 1.2 },
      { seconds: 300, multiplier: 1.0 },
      { seconds: 600, multiplier: 0.8 }
    ]
  },

  // ─── LEVEL DEFINITIONS ───────────────────────────────────────
  levels: [
    { id:1,  name:'Arduino Basics',           icon:'🔌', concepts:['setup()','loop()','Serial.print','variables'],           color:'#4CAF50' },
    { id:2,  name:'Digital I/O',              icon:'💡', concepts:['pinMode','digitalWrite','digitalRead','LEDs'],            color:'#2196F3' },
    { id:3,  name:'Analog & PWM',             icon:'📊', concepts:['analogRead','analogWrite','sensors','mapping'],           color:'#FF9800' },
    { id:4,  name:'Control Flow',             icon:'🔀', concepts:['if/else','switch-case','button logic','debounce'],        color:'#9C27B0' },
    { id:5,  name:'Loops & Timing',           icon:'⏱️', concepts:['for loops','while loops','millis()','non-blocking'],      color:'#F44336' },
    { id:6,  name:'Functions & Libraries',    icon:'📦', concepts:['custom functions','#include','Servo','parameters'],        color:'#00BCD4' },
    { id:7,  name:'Arrays & Sensor Data',     icon:'📈', concepts:['arrays','averaging','data logging','mapping'],             color:'#E91E63' },
    { id:8,  name:'ESP32 Fundamentals',       icon:'📡', concepts:['WiFi.h','GPIO','dual-core','ESP32 setup'],                 color:'#795548' },
    { id:9,  name:'Serial Communication',     icon:'🔗', concepts:['UART','Serial1','Arduino↔ESP32','protocols'],              color:'#607D8B' },
    { id:10, name:'IoT Final Boss',           icon:'🌐', concepts:['web server','MQTT','I2C','full system'],                   color:'#FFD700' }
  ],

  // ─── LESSONS (TEACHING CONTENT PER LEVEL) ───────────────────
  lessons: {
    1: {
      title: 'Arduino Basics: Your First Sketch',
      intro: 'Arduino uses C++ with two special functions: setup() runs once when the board powers on, and loop() runs forever after that. Let\'s learn the fundamentals.',
      sections: [
        {
          heading: 'The Arduino Structure',
          text: 'Every Arduino program (called a "sketch") has two main functions:<br>• <code>void setup()</code> — runs once at startup (initialize pins, start Serial)<br>• <code>void loop()</code> — runs repeatedly forever (your main program logic)',
          code: 'void setup() {\n    Serial.begin(9600);  // Start serial at 9600 baud\n    Serial.println("Arduino started!");\n}\n\nvoid loop() {\n    Serial.println("Running...");\n    delay(1000);  // Wait 1 second\n}'
        },
        {
          heading: 'Serial Monitor',
          text: '<code>Serial.begin(9600)</code> starts communication between Arduino and your computer. <code>Serial.print()</code> sends text without a newline, <code>Serial.println()</code> adds a newline. The number 9600 is the baud rate (speed of communication).',
          code: 'Serial.print("Value: ");   // No newline\nSerial.println(42);        // Prints 42 + newline\nSerial.println("Done!");   // Prints Done! + newline'
        },
        {
          heading: 'Variables in Arduino',
          text: 'Arduino uses standard C++ types: <code>int</code> for whole numbers, <code>float</code> for decimals, <code>bool</code> for true/false, <code>String</code> for text. Pin numbers are usually stored as <code>int</code> or <code>const int</code>.',
          code: 'const int LED_PIN = 13;    // Pin won\'t change\nint sensorValue = 0;       // Will be updated\nfloat temperature = 25.5;  // Decimal value\nbool isRunning = true;     // On/off state'
        },
        {
          heading: 'How We Simulate Arduino',
          text: 'Since we can\'t run real Arduino code here, we simulate it with standard C++. Think of <code>cin</code> as sensor input and <code>cout</code> as <code>Serial.println()</code>. The logic you learn here is <b>exactly</b> what runs on real Arduino hardware.',
          code: '// What you write here:        // Arduino equivalent:\ncout << "Hello";              // Serial.print("Hello");\ncout << value << endl;        // Serial.println(value);\ncin >> sensorValue;           // sensorValue = analogRead(A0);'
        }
      ],
      tip: 'Always call <code>Serial.begin(9600)</code> in <code>setup()</code> before using Serial. Forgetting this is the #1 beginner mistake!'
    },
    2: {
      title: 'Digital I/O: LEDs and Buttons',
      intro: 'Digital pins have two states: HIGH (5V / on) and LOW (0V / off). Learn to control LEDs and read buttons.',
      sections: [
        {
          heading: 'pinMode() — Setting Up Pins',
          text: '<code>pinMode(pin, mode)</code> configures a pin. Use <code>OUTPUT</code> for LEDs/motors, <code>INPUT</code> or <code>INPUT_PULLUP</code> for buttons/sensors. Always call this in <code>setup()</code>.',
          code: 'void setup() {\n    pinMode(13, OUTPUT);       // LED pin\n    pinMode(2, INPUT_PULLUP);  // Button with internal pull-up\n}'
        },
        {
          heading: 'digitalWrite() — Controlling LEDs',
          text: '<code>digitalWrite(pin, value)</code> sets a pin HIGH or LOW. HIGH turns an LED on, LOW turns it off.',
          code: 'digitalWrite(13, HIGH);  // LED ON\ndelay(1000);             // Wait 1 second\ndigitalWrite(13, LOW);   // LED OFF\ndelay(1000);             // Wait 1 second'
        },
        {
          heading: 'digitalRead() — Reading Buttons',
          text: '<code>digitalRead(pin)</code> returns HIGH or LOW. With <code>INPUT_PULLUP</code>, the button reads HIGH when NOT pressed and LOW when pressed (inverted!).',
          code: 'int buttonState = digitalRead(2);\nif (buttonState == LOW) {  // Button pressed (pull-up)\n    digitalWrite(13, HIGH); // Turn on LED\n} else {\n    digitalWrite(13, LOW);  // Turn off LED\n}'
        },
        {
          heading: 'Simulation Mapping',
          text: 'In our challenges: input <code>1</code> = HIGH (on/pressed), <code>0</code> = LOW (off/not pressed). Output <code>ON</code> or <code>OFF</code> to represent LED states.',
          code: '// Simulated: read pin state, output LED state\nint buttonState;  // 1=pressed, 0=not pressed\ncin >> buttonState;\nif (buttonState == 1) cout << "ON";\nelse cout << "OFF";'
        }
      ],
      tip: 'With INPUT_PULLUP, the logic is inverted: LOW means pressed! This trips up everyone at first.'
    },
    3: {
      title: 'Analog & PWM: Beyond On/Off',
      intro: 'Analog lets you read gradual values (0-1023) from sensors and write gradual outputs (0-255) using PWM.',
      sections: [
        {
          heading: 'analogRead() — Reading Sensors',
          text: '<code>analogRead(pin)</code> reads an analog pin (A0-A5 on Uno) and returns a value from 0 to 1023. Useful for potentiometers, light sensors, temperature sensors.',
          code: 'int sensorValue = analogRead(A0);  // 0-1023\nSerial.print("Sensor: ");\nSerial.println(sensorValue);'
        },
        {
          heading: 'analogWrite() — PWM Output',
          text: '<code>analogWrite(pin, value)</code> outputs a PWM signal (0-255) on supported pins (~3, 5, 6, 9, 10, 11 on Uno). 0 = fully off, 255 = fully on, 127 = 50% brightness.',
          code: 'analogWrite(9, 127);  // LED at 50% brightness\nanalogWrite(9, 255);  // LED at full brightness\nanalogWrite(9, 0);    // LED off'
        },
        {
          heading: 'map() — Scaling Values',
          text: 'The <code>map(value, fromLow, fromHigh, toLow, toHigh)</code> function scales a number from one range to another. Essential for converting sensor values to usable outputs.',
          code: 'int sensorVal = analogRead(A0);          // 0-1023\nint brightness = map(sensorVal, 0, 1023, 0, 255); // Scale to PWM\nanalogWrite(9, brightness);              // Control LED'
        },
        {
          heading: 'constrain() — Clamping Values',
          text: '<code>constrain(value, min, max)</code> keeps a value within a range. If value < min, returns min. If value > max, returns max.',
          code: 'int val = analogRead(A0);\nval = constrain(val, 100, 900);  // Clamp between 100-900'
        }
      ],
      tip: 'Remember: analogRead() returns 0-1023 (10-bit ADC), but analogWrite() accepts 0-255 (8-bit PWM). Always map between them!'
    },
    4: {
      title: 'Control Flow: Smart Decisions',
      intro: 'Real Arduino projects need decision-making: react to button presses, sensor thresholds, and multiple conditions.',
      sections: [
        {
          heading: 'if/else with Sensors',
          text: 'Use conditions to react to sensor readings. Compare analog values against thresholds to trigger actions.',
          code: 'int light = analogRead(A0);\nif (light < 300) {\n    digitalWrite(LED, HIGH);  // Dark: turn on light\n} else {\n    digitalWrite(LED, LOW);   // Bright: turn off light\n}'
        },
        {
          heading: 'Multiple Conditions',
          text: 'Use <code>else if</code> chains or <code>&&</code> (AND) / <code>||</code> (OR) to check multiple conditions. Common in multi-sensor projects.',
          code: 'int temp = readTemperature();\nint humidity = readHumidity();\n\nif (temp > 30 && humidity > 70) {\n    Serial.println("Too hot and humid!");\n    activateFan();\n} else if (temp < 10) {\n    Serial.println("Too cold!");\n    activateHeater();\n}'
        },
        {
          heading: 'switch-case for Menus',
          text: '<code>switch</code> is perfect for handling serial commands or button modes. Each <code>case</code> handles a specific value.',
          code: 'char command = Serial.read();\nswitch (command) {\n    case \'F\': moveForward();  break;\n    case \'B\': moveBackward(); break;\n    case \'L\': turnLeft();     break;\n    case \'R\': turnRight();    break;\n    case \'S\': stopMotors();   break;\n}'
        },
        {
          heading: 'Button Debouncing (Concept)',
          text: 'Buttons "bounce" — they rapidly toggle on/off when pressed. Debouncing waits a short time (e.g. 50ms) before accepting the reading as valid.',
          code: 'int lastState = HIGH;\nunsigned long lastDebounce = 0;\nconst int DEBOUNCE_DELAY = 50;\n\nvoid loop() {\n    int reading = digitalRead(BUTTON);\n    if (reading != lastState) {\n        lastDebounce = millis();\n    }\n    if (millis() - lastDebounce > DEBOUNCE_DELAY) {\n        // Accept this reading as stable\n    }\n    lastState = reading;\n}'
        }
      ],
      tip: 'Always debounce buttons in real projects! Without it, one press can register as 5-10 presses.'
    },
    5: {
      title: 'Loops & Timing: Beyond delay()',
      intro: 'delay() blocks everything. Learn non-blocking timing with millis() and powerful loop patterns for Arduino.',
      sections: [
        {
          heading: 'for Loops in Arduino',
          text: 'Use <code>for</code> loops to iterate through pins, create LED patterns, or repeat actions a set number of times.',
          code: '// Sweep through 6 LEDs\nint ledPins[] = {2, 3, 4, 5, 6, 7};\nfor (int i = 0; i < 6; i++) {\n    digitalWrite(ledPins[i], HIGH);\n    delay(100);\n    digitalWrite(ledPins[i], LOW);\n}'
        },
        {
          heading: 'The Problem with delay()',
          text: '<code>delay()</code> blocks ALL code — nothing else runs while waiting. This means you can\'t read buttons, update displays, or respond to serial during a delay.',
          code: '// BAD: Blocks for 2 full seconds, ignores button\ndigitalWrite(LED, HIGH);\ndelay(2000);\ndigitalWrite(LED, LOW);\n\n// During those 2 seconds, NOTHING else works!'
        },
        {
          heading: 'millis() — Non-Blocking Timing',
          text: '<code>millis()</code> returns milliseconds since the program started. Compare timestamps to create delays without blocking. This is THE key pattern for real Arduino projects.',
          code: 'unsigned long previousMillis = 0;\nconst long interval = 1000;  // 1 second\n\nvoid loop() {\n    unsigned long currentMillis = millis();\n    if (currentMillis - previousMillis >= interval) {\n        previousMillis = currentMillis;\n        // Toggle LED every 1 second WITHOUT blocking\n        ledState = !ledState;\n        digitalWrite(LED, ledState);\n    }\n    // Other code runs freely here!\n    readButton();\n    updateDisplay();\n}'
        },
        {
          heading: 'while Loops for Waiting',
          text: 'Use <code>while</code> loops when you need to wait for a specific condition, like waiting for Serial data or a sensor threshold.',
          code: 'while (!Serial.available()) {\n    // Wait for serial data\n}\nchar received = Serial.read();'
        }
      ],
      tip: 'Professional Arduino code NEVER uses delay() in the main loop. Always use millis() for timing!'
    },
    6: {
      title: 'Functions & Libraries',
      intro: 'Organize your code into reusable functions and leverage libraries for servos, displays, and more.',
      sections: [
        {
          heading: 'Writing Custom Functions',
          text: 'Break your code into small, reusable functions. Each function should do ONE thing well. This makes code readable, testable, and reusable.',
          code: 'int readTemperature(int pin) {\n    int raw = analogRead(pin);\n    float voltage = raw * 5.0 / 1024.0;\n    int tempC = (voltage - 0.5) * 100;\n    return tempC;\n}\n\nvoid setup() {\n    int temp = readTemperature(A0);\n    Serial.println(temp);\n}'
        },
        {
          heading: 'Parameters & Return Values',
          text: 'Functions can take inputs (parameters) and give back results (return values). Use <code>void</code> when a function doesn\'t return anything.',
          code: '// Takes pin number, returns mapped value\nint readSensor(int pin, int minVal, int maxVal) {\n    int raw = analogRead(pin);\n    return map(raw, 0, 1023, minVal, maxVal);\n}\n\n// No return value — just does an action\nvoid blinkLED(int pin, int times) {\n    for (int i = 0; i < times; i++) {\n        digitalWrite(pin, HIGH); delay(200);\n        digitalWrite(pin, LOW);  delay(200);\n    }\n}'
        },
        {
          heading: 'Using Libraries (#include)',
          text: 'Libraries add pre-built functionality. Include them at the top of your sketch. Common ones: <code>Servo.h</code>, <code>Wire.h</code> (I2C), <code>SPI.h</code>, <code>LiquidCrystal.h</code>.',
          code: '#include <Servo.h>\n\nServo myServo;\n\nvoid setup() {\n    myServo.attach(9);  // Servo on pin 9\n}\n\nvoid loop() {\n    myServo.write(0);    // Move to 0°\n    delay(1000);\n    myServo.write(90);   // Move to 90°\n    delay(1000);\n    myServo.write(180);  // Move to 180°\n    delay(1000);\n}'
        },
        {
          heading: 'The Servo Library Deep Dive',
          text: 'A servo motor moves to a specific angle (0-180°). <code>attach(pin)</code> connects it, <code>write(angle)</code> moves it, <code>read()</code> gets current angle. Great for robotic arms, steering, doors.',
          code: '#include <Servo.h>\nServo gripServo;\ngripServo.attach(9);\n\nvoid openGripper()  { gripServo.write(180); }\nvoid closeGripper() { gripServo.write(0);   }\nvoid halfOpen()     { gripServo.write(90);  }'
        }
      ],
      tip: 'If you copy-paste code more than twice, it should be a function! Clean code = fewer bugs.'
    },
    7: {
      title: 'Arrays & Sensor Data',
      intro: 'Store sensor readings in arrays, compute averages, detect patterns, and log data like a real data acquisition system.',
      sections: [
        {
          heading: 'Arrays for Pin Lists',
          text: 'Use arrays to manage multiple pins efficiently. Combined with for-loops, you can control dozens of LEDs or read multiple sensors with minimal code.',
          code: 'const int NUM_LEDS = 6;\nint ledPins[NUM_LEDS] = {2, 3, 4, 5, 6, 7};\n\nvoid setup() {\n    for (int i = 0; i < NUM_LEDS; i++) {\n        pinMode(ledPins[i], OUTPUT);\n    }\n}'
        },
        {
          heading: 'Averaging Sensor Readings',
          text: 'Sensors are noisy. Take multiple readings and average them for stable values. This is called a "moving average" or "smoothing" filter.',
          code: 'const int NUM_SAMPLES = 10;\nint readings[NUM_SAMPLES];\nint readIndex = 0;\nint total = 0;\n\nint smoothedRead(int pin) {\n    total -= readings[readIndex];\n    readings[readIndex] = analogRead(pin);\n    total += readings[readIndex];\n    readIndex = (readIndex + 1) % NUM_SAMPLES;\n    return total / NUM_SAMPLES;\n}'
        },
        {
          heading: 'Data Logging Pattern',
          text: 'Store sensor data over time in an array. This is how weather stations and data loggers work.',
          code: 'const int LOG_SIZE = 100;\nint tempLog[LOG_SIZE];\nint logCount = 0;\n\nvoid logTemperature() {\n    if (logCount < LOG_SIZE) {\n        tempLog[logCount] = readTemperature(A0);\n        logCount++;\n    }\n}\n\nvoid printLog() {\n    for (int i = 0; i < logCount; i++) {\n        Serial.print(i); Serial.print(": ");\n        Serial.println(tempLog[i]);\n    }\n}'
        },
        {
          heading: 'Finding Min/Max in Data',
          text: 'Find the minimum and maximum values in a set of readings — essential for calibration and threshold detection.',
          code: 'int findMax(int arr[], int size) {\n    int maxVal = arr[0];\n    for (int i = 1; i < size; i++) {\n        if (arr[i] > maxVal) maxVal = arr[i];\n    }\n    return maxVal;\n}'
        }
      ],
      tip: 'In real Arduino projects, always smooth sensor data! A single reading can be wildly inaccurate due to electrical noise.'
    },
    8: {
      title: 'ESP32 Fundamentals',
      intro: 'The ESP32 is a powerful microcontroller with built-in WiFi and Bluetooth. It\'s the brain of IoT projects and communicates with Arduino boards.',
      sections: [
        {
          heading: 'ESP32 vs Arduino',
          text: 'The ESP32 is much more powerful than Arduino Uno:<br>• <b>Dual-core CPU</b> at 240MHz (Uno: single-core 16MHz)<br>• <b>Built-in WiFi & Bluetooth</b><br>• <b>More GPIO pins</b> with more features<br>• <b>12-bit ADC</b> (0-4095 vs Arduino\'s 10-bit 0-1023)<br>• Can run both Arduino code AND FreeRTOS tasks',
          code: '// ESP32 uses the same Arduino framework!\nvoid setup() {\n    Serial.begin(115200);  // ESP32 uses 115200 baud\n    Serial.println("ESP32 Ready!");\n}\n\nvoid loop() {\n    // Same structure as Arduino\n}'
        },
        {
          heading: 'WiFi Connection',
          text: '<code>WiFi.h</code> lets the ESP32 connect to WiFi networks. Essential for IoT projects.',
          code: '#include <WiFi.h>\n\nconst char* ssid = "MyNetwork";\nconst char* password = "MyPassword";\n\nvoid setup() {\n    Serial.begin(115200);\n    WiFi.begin(ssid, password);\n    while (WiFi.status() != WL_CONNECTED) {\n        delay(500);\n        Serial.print(".");\n    }\n    Serial.println("\\nConnected!");\n    Serial.println(WiFi.localIP());\n}'
        },
        {
          heading: 'ESP32 GPIO Differences',
          text: 'ESP32 GPIO pins work differently from Arduino:<br>• Use any pin for digital I/O (not just specific ones)<br>• ADC is 12-bit: <code>analogRead()</code> returns 0-4095<br>• PWM uses <code>ledcWrite()</code> instead of <code>analogWrite()</code><br>• Some pins are input-only (34, 35, 36, 39)',
          code: '// ESP32 PWM setup (different from Arduino!)\nledcSetup(0, 5000, 8);    // Channel 0, 5kHz, 8-bit\nledcAttachPin(2, 0);       // Attach GPIO 2 to channel 0\nledcWrite(0, 128);         // 50% duty cycle'
        },
        {
          heading: 'Why ESP32 + Arduino Together?',
          text: 'In robotics, you often use BOTH: Arduino handles real-time sensor/motor control (it\'s simpler and more reliable for timing), while ESP32 handles WiFi, web dashboards, and communication. They talk via Serial (UART), I2C, or SPI.',
          code: '// ESP32 reads data FROM Arduino via Serial\nif (Serial2.available()) {\n    String data = Serial2.readStringUntil(\'\\n\');\n    // Send data to web dashboard\n    sendToServer(data);\n}\n\n// ESP32 sends commands TO Arduino\nSerial2.println("MOTOR:FORWARD:100");'
        }
      ],
      tip: 'ESP32 uses 3.3V logic, not 5V! Use a level shifter when connecting to 5V Arduino.'
    },
    9: {
      title: 'Serial Communication: Arduino ↔ ESP32',
      intro: 'Learn how to make Arduino and ESP32 talk to each other using UART serial communication — the foundation of multi-board robotics.',
      sections: [
        {
          heading: 'What is UART?',
          text: 'UART (Universal Asynchronous Receiver/Transmitter) is the simplest way for two boards to communicate. It uses two wires: TX (transmit) and RX (receive). Arduino\'s TX connects to ESP32\'s RX and vice versa.',
          code: '// Arduino side (sends data)\nSerial.begin(9600);          // USB serial (for debug)\nSerial1.begin(9600);         // Hardware serial (to ESP32)\nSerial1.println("TEMP:25.5"); // Send data to ESP32\n\n// ESP32 side (receives data)\nSerial2.begin(9600, SERIAL_8N1, 16, 17);  // RX=16, TX=17\nif (Serial2.available()) {\n    String data = Serial2.readStringUntil(\'\\n\');\n}'
        },
        {
          heading: 'Designing a Communication Protocol',
          text: 'Always structure your messages! Use a format like <code>KEY:VALUE</code> or <code>SENSOR_ID,VALUE,TIMESTAMP</code>. Both boards must agree on the format.',
          code: '// Arduino sends structured data:\nSerial1.print("T:");\nSerial1.print(temperature);\nSerial1.print(",H:");\nSerial1.print(humidity);\nSerial1.println();  // Newline = end of message\n// Sends: "T:25.5,H:60"\n\n// ESP32 parses it:\nString msg = Serial2.readStringUntil(\'\\n\');\nint tIdx = msg.indexOf("T:") + 2;\nint hIdx = msg.indexOf(",H:") + 3;\nfloat temp = msg.substring(tIdx, msg.indexOf(",")).toFloat();\nfloat hum = msg.substring(hIdx).toFloat();'
        },
        {
          heading: 'Bidirectional Communication',
          text: 'Both boards can send AND receive. Arduino sends sensor data to ESP32, and ESP32 sends commands back to Arduino.',
          code: '// ARDUINO: Send sensors, receive commands\nvoid loop() {\n    // Send sensor data\n    Serial1.print("DIST:");\n    Serial1.println(readUltrasonic());\n\n    // Check for commands\n    if (Serial1.available()) {\n        String cmd = Serial1.readStringUntil(\'\\n\');\n        if (cmd == "FWD") moveForward();\n        if (cmd == "STOP") stopMotors();\n    }\n}'
        },
        {
          heading: 'Wiring It Up',
          text: '<b>Physical connections:</b><br>• Arduino TX → ESP32 RX (through 3.3V level shifter)<br>• Arduino RX ← ESP32 TX (ESP32 is already 3.3V)<br>• Common GND (MUST share ground!)<br><br><b>IMPORTANT:</b> ESP32 is 3.3V, Arduino is 5V. Use a voltage divider or level shifter on Arduino TX → ESP32 RX.',
          code: '// WIRING SUMMARY:\n// Arduino Pin 1 (TX) → Level Shifter → ESP32 GPIO 16 (RX)\n// Arduino Pin 0 (RX) ← ESP32 GPIO 17 (TX)\n// Arduino GND ↔ ESP32 GND\n//\n// Use Serial1 on Arduino Mega (pins 18/19)\n// or SoftwareSerial on Arduino Uno'
        }
      ],
      tip: 'ALWAYS connect GND between boards! Without a common ground, serial communication won\'t work at all.'
    },
    10: {
      title: 'IoT Final Boss: Full Connected System',
      intro: 'Combine everything: Arduino reads sensors and controls actuators, ESP32 handles WiFi, web server, and cloud connectivity. Build a complete IoT system.',
      sections: [
        {
          heading: 'System Architecture',
          text: 'A complete IoT system has layers:<br>1. <b>Sense</b> — Arduino reads sensors (temp, distance, light)<br>2. <b>Communicate</b> — Arduino sends data to ESP32 via Serial<br>3. <b>Process</b> — ESP32 processes and hosts a web dashboard<br>4. <b>Act</b> — ESP32 sends commands back to Arduino to control motors/LEDs',
          code: '// SYSTEM FLOW:\n// [Sensors] → [Arduino] → UART → [ESP32] → WiFi → [Dashboard]\n// [Dashboard] → WiFi → [ESP32] → UART → [Arduino] → [Motors]'
        },
        {
          heading: 'ESP32 Web Server',
          text: 'ESP32 can host a web page that shows sensor data and has buttons to control the Arduino. Uses the <code>WebServer</code> library.',
          code: '#include <WiFi.h>\n#include <WebServer.h>\nWebServer server(80);\n\nvoid handleRoot() {\n    String html = "<h1>Robot Dashboard</h1>";\n    html += "<p>Temperature: " + String(lastTemp) + "°C</p>";\n    html += "<a href=\'/forward\'>Forward</a> ";\n    html += "<a href=\'/stop\'>Stop</a>";\n    server.send(200, "text/html", html);\n}\n\nvoid handleForward() {\n    Serial2.println("FWD");  // Send to Arduino\n    server.send(200, "text/html", "Moving forward!");\n}\n\nvoid setup() {\n    server.on("/", handleRoot);\n    server.on("/forward", handleForward);\n    server.begin();\n}'
        },
        {
          heading: 'I2C Communication (Wire.h)',
          text: 'I2C is another protocol for Arduino ↔ ESP32 communication. Uses only 2 wires (SDA, SCL) and supports multiple devices on the same bus. One device is "master", others are "slaves".',
          code: '// ARDUINO (Slave, address 0x08)\n#include <Wire.h>\nvoid setup() {\n    Wire.begin(0x08);  // Join as slave\n    Wire.onReceive(receiveEvent);\n    Wire.onRequest(requestEvent);\n}\nvoid receiveEvent(int bytes) {\n    char cmd = Wire.read();  // Read command from ESP32\n}\nvoid requestEvent() {\n    Wire.write(sensorValue);  // Send data to ESP32\n}\n\n// ESP32 (Master)\n#include <Wire.h>\nvoid setup() { Wire.begin(); }\nvoid loop() {\n    Wire.requestFrom(0x08, 1);  // Request from slave\n    int val = Wire.read();\n}'
        },
        {
          heading: 'Putting It All Together',
          text: 'The final boss challenge combines: data collection, serial parsing, command processing, and structured output. This simulates the complete flow of a real robotics IoT system.',
          code: '// Complete system flow:\n// 1. Arduino reads sensors → sends "T:25,H:60,D:150"\n// 2. ESP32 receives → parses → displays on web page\n// 3. User clicks "Forward" on web page\n// 4. ESP32 sends "CMD:FWD" to Arduino\n// 5. Arduino receives → drives motors forward\n// 6. Repeat!'
        }
      ],
      tip: 'Start by getting Serial communication working reliably FIRST. Once that works, add WiFi, then web server, then commands. Don\'t try to build everything at once!'
    }
  },

  // ─── ACHIEVEMENTS ────────────────────────────────────────────
  achievements: [
    { id:'first_solve',    icon:'🏆', name:'First Byte',       desc:'Complete your first challenge' },
    { id:'ten_solves',     icon:'⭐', name:'Serial Veteran',   desc:'Complete 10 challenges' },
    { id:'perfect_score',  icon:'💎', name:'Perfect Signal',   desc:'Score 100 on any challenge' },
    { id:'streak_3',       icon:'🔥', name:'On Fire',          desc:'3-day coding streak' },
    { id:'streak_7',       icon:'💥', name:'Unstoppable',      desc:'7-day coding streak' },
    { id:'loop_master',    icon:'🔄', name:'Loop Master',      desc:'Complete all Loops & Timing challenges' },
    { id:'pointer_pro',    icon:'📦', name:'Library Wizard',   desc:'Complete all Functions & Libraries challenges' },
    { id:'oop_wizard',     icon:'📈', name:'Data Logger',      desc:'Complete all Arrays & Sensor Data challenges' },
    { id:'level_clear',    icon:'✅', name:'Level Cleared',    desc:'Complete every challenge in any level' },
    { id:'speed_demon',    icon:'⚡', name:'Speed Demon',      desc:'Solve any challenge in under 60 seconds' },
    { id:'no_hints_5',     icon:'🧠', name:'No Hints Needed',  desc:'Solve 5 challenges without using any hints' },
    { id:'block_builder',  icon:'🧱', name:'Block Builder',    desc:'Solve 3 challenges using EduKits beginner mode' },
    { id:'final_boss',     icon:'🌐', name:'IoT Master',       desc:'Defeat the Final Boss challenge' },
    { id:'grand_master',   icon:'👑', name:'Grand Master',     desc:'Complete ALL challenges in the simulator' }
  ],

  // ─── CHALLENGES ──────────────────────────────────────────────
  challenges: [

    // ══════════════════════════════════════════════════════════
    // LEVEL 1 : ARDUINO BASICS
    // ══════════════════════════════════════════════════════════
    {
      id:'l1c1', level:1,
      title:'Serial Monitor Output',
      difficulty:'Easy', topic:'Serial.println simulation',
      description:'Simulate an Arduino\'s <code>Serial.println()</code>. Read a sensor name and its value, then print them in the format Arduino would display on the Serial Monitor: <code>Sensor: NAME = VALUE</code>.',
      inputFormat:'Two lines: a string (sensor name) and an integer (sensor value).',
      outputFormat:'<code>Sensor: NAME = VALUE</code>',
      sampleInput:'Temperature\n25', sampleOutput:'Sensor: Temperature = 25',
      constraints:'Sensor name has no spaces. Value is an integer.',
      hints:['Use <code>cin >> name >> value;</code> to read both inputs.','Use <code>cout</code> to format the output like Serial.println() would.'],
      solution:'#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string name;\n    int value;\n    cin >> name >> value;\n    cout << "Sensor: " << name << " = " << value;\n    return 0;\n}',
      starterCode:'#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    // Read sensor name and value\n    // Print: Sensor: NAME = VALUE\n    \n    return 0;\n}',
      commonMistakes:['Forgetting spaces around the = sign','Not reading the string first, then the integer','Using wrong output format'],
      edgeCases:['Zero value','Large sensor values'],
      testCases:[
        { input:'Temperature\n25', expectedOutput:'Sensor: Temperature = 25', desc:'Temperature reading' },
        { input:'Light\n0',        expectedOutput:'Sensor: Light = 0',        desc:'Zero value' },
        { input:'Distance\n1023',  expectedOutput:'Sensor: Distance = 1023',  desc:'Max analog value' },
        { input:'Humidity\n-5',    expectedOutput:'Sensor: Humidity = -5',     desc:'Negative value' }
      ]
    },
    {
      id:'l1c2', level:1,
      title:'Variable Types',
      difficulty:'Easy', topic:'Arduino Data Types',
      description:'In Arduino, choosing the right data type matters — memory is limited! Read a temperature as a decimal (float), convert it to an integer (truncate, not round), and print both.<br>Format: <code>Float: X.XX</code> then <code>Int: Y</code>',
      inputFormat:'A single decimal number (temperature).',
      outputFormat:'Two lines: <code>Float: X.XX</code> and <code>Int: Y</code> (use fixed 2 decimal places for float).',
      sampleInput:'25.75', sampleOutput:'Float: 25.75\nInt: 25',
      constraints:'−50.0 ≤ temperature ≤ 150.0',
      hints:['Use <code>float</code> and <code>int</code> types.','Cast float to int with <code>(int)</code> to truncate.','Use <code>fixed</code> and <code>setprecision(2)</code> for 2 decimal places.'],
      solution:'#include <iostream>\n#include <iomanip>\nusing namespace std;\n\nint main() {\n    float temp;\n    cin >> temp;\n    cout << fixed << setprecision(2);\n    cout << "Float: " << temp << endl;\n    cout << "Int: " << (int)temp;\n    return 0;\n}',
      starterCode:'#include <iostream>\n#include <iomanip>\nusing namespace std;\n\nint main() {\n    float temp;\n    cin >> temp;\n    // Print Float: X.XX and Int: Y\n    \n    return 0;\n}',
      commonMistakes:['Not using fixed/setprecision for float formatting','Rounding instead of truncating','Wrong output labels'],
      edgeCases:['Negative temperatures','Whole number input','Very small decimal'],
      testCases:[
        { input:'25.75',  expectedOutput:'Float: 25.75\nInt: 25',    desc:'Positive decimal' },
        { input:'-3.14',  expectedOutput:'Float: -3.14\nInt: -3',    desc:'Negative value' },
        { input:'100.00', expectedOutput:'Float: 100.00\nInt: 100',  desc:'Whole number' },
        { input:'0.99',   expectedOutput:'Float: 0.99\nInt: 0',      desc:'Less than 1' }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // LEVEL 2 : DIGITAL I/O
    // ══════════════════════════════════════════════════════════
    {
      id:'l2c1', level:2,
      title:'LED Controller',
      difficulty:'Easy', topic:'digitalWrite simulation',
      description:'Simulate <code>digitalWrite()</code>. Read a pin number (0-13) and a state (0=LOW, 1=HIGH). Print the result like an Arduino debug message: <code>Pin X: HIGH</code> or <code>Pin X: LOW</code>.',
      inputFormat:'Two integers: pin number and state (0 or 1).',
      outputFormat:'<code>Pin X: HIGH</code> or <code>Pin X: LOW</code>',
      sampleInput:'13 1', sampleOutput:'Pin 13: HIGH',
      constraints:'0 ≤ pin ≤ 13, state is 0 or 1.',
      hints:['Use if/else to check if state is 1 or 0.','Map 1 to "HIGH" and 0 to "LOW".'],
      solution:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int pin, state;\n    cin >> pin >> state;\n    cout << "Pin " << pin << ": " << (state == 1 ? "HIGH" : "LOW");\n    return 0;\n}',
      starterCode:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int pin, state;\n    cin >> pin >> state;\n    // Print Pin X: HIGH or Pin X: LOW\n    \n    return 0;\n}',
      commonMistakes:['Forgetting the space after "Pin"','Using wrong case for HIGH/LOW','Not reading both inputs'],
      edgeCases:['Pin 0','Pin 13','Various states'],
      testCases:[
        { input:'13 1', expectedOutput:'Pin 13: HIGH', desc:'Built-in LED on' },
        { input:'13 0', expectedOutput:'Pin 13: LOW',  desc:'Built-in LED off' },
        { input:'2 1',  expectedOutput:'Pin 2: HIGH',  desc:'External LED on' },
        { input:'0 0',  expectedOutput:'Pin 0: LOW',   desc:'Pin 0 off' }
      ]
    },
    {
      id:'l2c2', level:2,
      title:'Button to LED',
      difficulty:'Easy', topic:'digitalRead + digitalWrite',
      description:'Simulate reading a button and controlling an LED. Read <code>N</code> button states (0=not pressed, 1=pressed) and for each one, output the LED state. When button is pressed (1), LED should be ON. When not pressed (0), LED should be OFF.',
      inputFormat:'First line: integer N (number of readings). Second line: N space-separated integers (0 or 1).',
      outputFormat:'N lines, each saying <code>LED: ON</code> or <code>LED: OFF</code>.',
      sampleInput:'4\n0 1 1 0', sampleOutput:'LED: OFF\nLED: ON\nLED: ON\nLED: OFF',
      constraints:'1 ≤ N ≤ 100',
      hints:['Loop through each button reading.','If reading is 1, output ON. Otherwise, OFF.'],
      solution:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    for (int i = 0; i < n; i++) {\n        int btn;\n        cin >> btn;\n        cout << "LED: " << (btn == 1 ? "ON" : "OFF") << endl;\n    }\n    return 0;\n}',
      starterCode:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    // For each button reading, output LED state\n    \n    return 0;\n}',
      commonMistakes:['Forgetting endl between outputs','Off-by-one in loop','Not reading the count first'],
      edgeCases:['All pressed','All not pressed','Single reading'],
      testCases:[
        { input:'4\n0 1 1 0',    expectedOutput:'LED: OFF\nLED: ON\nLED: ON\nLED: OFF', desc:'Mixed states' },
        { input:'1\n1',           expectedOutput:'LED: ON',                               desc:'Single ON' },
        { input:'3\n0 0 0',      expectedOutput:'LED: OFF\nLED: OFF\nLED: OFF',          desc:'All off' },
        { input:'2\n1 1',        expectedOutput:'LED: ON\nLED: ON',                      desc:'All on' }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // LEVEL 3 : ANALOG & PWM
    // ══════════════════════════════════════════════════════════
    {
      id:'l3c1', level:3,
      title:'Analog to PWM Mapper',
      difficulty:'Easy', topic:'map() function',
      description:'Simulate Arduino\'s <code>map()</code> function. Read an analog sensor value (0-1023) and map it to a PWM output range (0-255). Print the result as an integer (truncated).<br>Formula: <code>output = input × 255 / 1023</code>',
      inputFormat:'A single integer (0-1023).',
      outputFormat:'<code>PWM: X</code> where X is the mapped value.',
      sampleInput:'512', sampleOutput:'PWM: 127',
      constraints:'0 ≤ input ≤ 1023',
      hints:['Use integer arithmetic: <code>value * 255 / 1023</code>','This is exactly what Arduino\'s map() does internally.'],
      solution:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int sensorVal;\n    cin >> sensorVal;\n    int pwm = sensorVal * 255 / 1023;\n    cout << "PWM: " << pwm;\n    return 0;\n}',
      starterCode:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int sensorVal;\n    cin >> sensorVal;\n    // Map from 0-1023 to 0-255 and print\n    \n    return 0;\n}',
      commonMistakes:['Using float division when integer is expected','Getting the mapping formula wrong','Forgetting the output label'],
      edgeCases:['Value 0','Value 1023','Mid-range value'],
      testCases:[
        { input:'0',    expectedOutput:'PWM: 0',   desc:'Minimum value' },
        { input:'1023', expectedOutput:'PWM: 255', desc:'Maximum value' },
        { input:'512',  expectedOutput:'PWM: 127', desc:'Mid range' },
        { input:'256',  expectedOutput:'PWM: 63',  desc:'Quarter range' }
      ]
    },
    {
      id:'l3c2', level:3,
      title:'Temperature Classifier',
      difficulty:'Medium', topic:'analogRead + thresholds',
      description:'Simulate reading a temperature sensor. The raw analog value (0-1023) maps to temperature: <code>temp = value × 500 / 1023 − 50</code> (simulated TMP36 sensor, range −50°C to 450°C).<br>Classify: <code>COLD</code> (below 15), <code>COMFORTABLE</code> (15-30), <code>HOT</code> (above 30).<br>Print: <code>Temp: X°C - STATUS</code>',
      inputFormat:'A single integer (raw analog value 0-1023).',
      outputFormat:'<code>Temp: X°C - STATUS</code>',
      sampleInput:'150', sampleOutput:'Temp: 23°C - COMFORTABLE',
      constraints:'0 ≤ raw ≤ 1023',
      hints:['First convert raw to temperature using the formula.','Then use if/else to classify.','Integer division: <code>raw * 500 / 1023 - 50</code>'],
      solution:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int raw;\n    cin >> raw;\n    int temp = raw * 500 / 1023 - 50;\n    string status;\n    if (temp < 15) status = "COLD";\n    else if (temp <= 30) status = "COMFORTABLE";\n    else status = "HOT";\n    cout << "Temp: " << temp << "\\xC2\\xB0C - " << status;\n    return 0;\n}',
      starterCode:'#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    int raw;\n    cin >> raw;\n    // Convert raw analog value to temperature\n    // Classify as COLD, COMFORTABLE, or HOT\n    \n    return 0;\n}',
      commonMistakes:['Getting the temperature formula wrong','Wrong boundary conditions for classification','Forgetting the degree symbol'],
      edgeCases:['Raw value 0 (coldest)','Raw value 1023 (hottest)','Boundary temperatures'],
      testCases:[
        { input:'150', expectedOutput:'Temp: 23\u00B0C - COMFORTABLE', desc:'Room temperature' },
        { input:'0',   expectedOutput:'Temp: -50\u00B0C - COLD',       desc:'Minimum reading' },
        { input:'1023', expectedOutput:'Temp: 450\u00B0C - HOT',       desc:'Maximum reading' },
        { input:'50',  expectedOutput:'Temp: -25\u00B0C - COLD',       desc:'Cold reading' }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // LEVEL 4 : CONTROL FLOW
    // ══════════════════════════════════════════════════════════
    {
      id:'l4c1', level:4,
      title:'Robot Command Parser',
      difficulty:'Medium', topic:'switch-case',
      description:'Simulate a robot receiving serial commands. Read a character command and print the action:<br><code>F</code>→Forward, <code>B</code>→Backward, <code>L</code>→Left, <code>R</code>→Right, <code>S</code>→Stop, anything else→Unknown.',
      inputFormat:'A single character.',
      outputFormat:'<code>Action: DIRECTION</code>',
      sampleInput:'F', sampleOutput:'Action: Forward',
      constraints:'Input is a single uppercase letter.',
      hints:['Use a <code>switch</code> statement on the character.','Don\'t forget <code>break</code> after each case!','Use <code>default</code> for unknown commands.'],
      solution:'#include <iostream>\nusing namespace std;\n\nint main() {\n    char cmd;\n    cin >> cmd;\n    cout << "Action: ";\n    switch (cmd) {\n        case \'F\': cout << "Forward";  break;\n        case \'B\': cout << "Backward"; break;\n        case \'L\': cout << "Left";     break;\n        case \'R\': cout << "Right";    break;\n        case \'S\': cout << "Stop";     break;\n        default:  cout << "Unknown";  break;\n    }\n    return 0;\n}',
      starterCode:'#include <iostream>\nusing namespace std;\n\nint main() {\n    char cmd;\n    cin >> cmd;\n    // Use switch-case to print the action\n    \n    return 0;\n}',
      commonMistakes:['Forgetting break statements (fall-through)','Using double quotes for char comparison','Missing default case'],
      edgeCases:['Unknown command','All valid commands'],
      testCases:[
        { input:'F', expectedOutput:'Action: Forward',  desc:'Forward command' },
        { input:'B', expectedOutput:'Action: Backward', desc:'Backward command' },
        { input:'L', expectedOutput:'Action: Left',     desc:'Left command' },
        { input:'R', expectedOutput:'Action: Right',    desc:'Right command' },
        { input:'S', expectedOutput:'Action: Stop',     desc:'Stop command' },
        { input:'X', expectedOutput:'Action: Unknown',  desc:'Unknown command' }
      ]
    },
    {
      id:'l4c2', level:4,
      title:'Obstacle Avoidance Logic',
      difficulty:'Medium', topic:'Multi-sensor decisions',
      description:'Simulate a robot with 3 distance sensors: Left, Center, Right. Each reads a distance in cm. If a sensor reads <b>below 20cm</b>, there\'s an obstacle on that side.<br>Decision logic:<br>• Center blocked → turn (pick side with more room)<br>• Left blocked only → turn right<br>• Right blocked only → turn left<br>• None blocked → go forward<br>• All blocked → reverse',
      inputFormat:'Three integers: left, center, right distances (cm).',
      outputFormat:'The action: <code>FORWARD</code>, <code>LEFT</code>, <code>RIGHT</code>, or <code>REVERSE</code>',
      sampleInput:'50 10 50', sampleOutput:'RIGHT',
      constraints:'0 ≤ distance ≤ 400',
      hints:['Check "all blocked" first, then center, then sides, then forward.','When center is blocked and both sides are free, turn toward the side with greater distance.','Threshold for obstacle: < 20cm.'],
      solution:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int left, center, right;\n    cin >> left >> center >> right;\n    bool lBlocked = left < 20;\n    bool cBlocked = center < 20;\n    bool rBlocked = right < 20;\n    if (lBlocked && cBlocked && rBlocked) cout << "REVERSE";\n    else if (cBlocked) {\n        if (left >= right) cout << "LEFT";\n        else cout << "RIGHT";\n    }\n    else if (lBlocked && !rBlocked) cout << "RIGHT";\n    else if (rBlocked && !lBlocked) cout << "LEFT";\n    else cout << "FORWARD";\n    return 0;\n}',
      starterCode:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int left, center, right;\n    cin >> left >> center >> right;\n    // Implement obstacle avoidance logic\n    \n    return 0;\n}',
      commonMistakes:['Wrong order of condition checking','Not handling the "center blocked" tiebreaker correctly','Forgetting the all-blocked case'],
      edgeCases:['All clear','All blocked','Center blocked, equal sides','Only one side blocked'],
      testCases:[
        { input:'50 50 50',   expectedOutput:'FORWARD', desc:'All clear' },
        { input:'5 5 5',      expectedOutput:'REVERSE', desc:'All blocked' },
        { input:'50 10 50',   expectedOutput:'LEFT',    desc:'Center blocked, equal (left >= right)' },
        { input:'10 50 50',   expectedOutput:'RIGHT',   desc:'Left blocked only' },
        { input:'50 50 10',   expectedOutput:'LEFT',    desc:'Right blocked only' },
        { input:'30 10 50',   expectedOutput:'RIGHT',   desc:'Center blocked, right has more room' }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // LEVEL 5 : LOOPS & TIMING
    // ══════════════════════════════════════════════════════════
    {
      id:'l5c1', level:5,
      title:'LED Chase Pattern',
      difficulty:'Medium', topic:'for loops & patterns',
      description:'Simulate an LED chase (Knight Rider) effect across N LEDs. Print the LED states for one complete sweep (left-to-right, then right-to-left). <code>*</code> = LED on, <code>.</code> = LED off.<br>Example for 5 LEDs: first LED 0 on, then LED 1, ..., LED 4, then LED 3, LED 2, LED 1 (don\'t repeat the endpoints).',
      inputFormat:'A single integer N (number of LEDs).',
      outputFormat:'Each line shows the LED pattern for one step. N + (N-2) lines total.',
      sampleInput:'4', sampleOutput:'*...\n.*..\n..*.\n...*\n..*.\n.*..',
      constraints:'2 ≤ N ≤ 20',
      hints:['First loop: i from 0 to N-1 (left to right).','Second loop: i from N-2 to 1 (right to left, skip endpoints).','For each step, print . for all LEDs except the active one which gets *.'],
      solution:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    // Left to right\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++)\n            cout << (j == i ? \'*\' : \'.\');\n        cout << endl;\n    }\n    // Right to left (skip endpoints)\n    for (int i = n - 2; i >= 1; i--) {\n        for (int j = 0; j < n; j++)\n            cout << (j == i ? \'*\' : \'.\');\n        cout << endl;\n    }\n    return 0;\n}',
      starterCode:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    // Print LED chase pattern: left-to-right then right-to-left\n    \n    return 0;\n}',
      commonMistakes:['Repeating the endpoints (double-printing first and last LED)','Wrong loop bounds for the return sweep','Using wrong characters'],
      edgeCases:['Minimum 2 LEDs','Larger LED counts'],
      testCases:[
        { input:'4', expectedOutput:'*...\n.*..\n..*.\n...*\n..*.\n..*.', desc:'4 LEDs' },
        { input:'2', expectedOutput:'*.\n.*', desc:'Minimum 2 LEDs' },
        { input:'3', expectedOutput:'*..\n.*.\n..*\n.*.', desc:'3 LEDs' }
      ]
    },
    {
      id:'l5c2', level:5,
      title:'millis() Timer Simulator',
      difficulty:'Medium', topic:'Non-blocking timing',
      description:'Simulate non-blocking timing with <code>millis()</code>. Given a list of timestamps (in ms) and an interval, determine at which timestamps an action fires.<br>An action fires when <code>currentTime - lastFireTime >= interval</code>. The first fire happens at the first timestamp >= interval. Print <code>FIRE</code> or <code>WAIT</code> for each timestamp.',
      inputFormat:'Line 1: interval in ms. Line 2: N (number of timestamps). Line 3: N timestamps in ascending order.',
      outputFormat:'N lines: <code>T=XXX: FIRE</code> or <code>T=XXX: WAIT</code>',
      sampleInput:'1000\n6\n0 500 1000 1500 2000 2500', sampleOutput:'T=0: WAIT\nT=500: WAIT\nT=1000: FIRE\nT=1500: WAIT\nT=2000: FIRE\nT=2500: WAIT',
      constraints:'1 ≤ interval ≤ 10000, 1 ≤ N ≤ 50, timestamps are non-decreasing.',
      hints:['Track <code>lastFireTime</code>, starting at 0.','At each timestamp, check if <code>current - lastFireTime >= interval</code>.','When it fires, update <code>lastFireTime = current</code>.'],
      solution:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int interval, n;\n    cin >> interval >> n;\n    int lastFire = 0;\n    bool fired = false;\n    for (int i = 0; i < n; i++) {\n        int t;\n        cin >> t;\n        if (t - lastFire >= interval && (fired || t >= interval)) {\n            cout << "T=" << t << ": FIRE" << endl;\n            lastFire = t;\n            fired = true;\n        } else {\n            cout << "T=" << t << ": WAIT" << endl;\n        }\n    }\n    return 0;\n}',
      starterCode:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int interval, n;\n    cin >> interval >> n;\n    // Simulate millis()-based non-blocking timer\n    \n    return 0;\n}',
      commonMistakes:['Firing at time 0','Not updating lastFireTime when firing','Wrong comparison operator'],
      edgeCases:['Very short interval','Timestamps that exactly match the interval','Long gaps between timestamps'],
      testCases:[
        { input:'1000\n6\n0 500 1000 1500 2000 2500', expectedOutput:'T=0: WAIT\nT=500: WAIT\nT=1000: FIRE\nT=1500: WAIT\nT=2000: FIRE\nT=2500: WAIT', desc:'Regular timing' },
        { input:'500\n4\n0 500 1000 1500', expectedOutput:'T=0: WAIT\nT=500: FIRE\nT=1000: FIRE\nT=1500: FIRE', desc:'Fast interval' },
        { input:'2000\n3\n0 1000 2000', expectedOutput:'T=0: WAIT\nT=1000: WAIT\nT=2000: FIRE', desc:'Long interval' }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // LEVEL 6 : FUNCTIONS & LIBRARIES
    // ══════════════════════════════════════════════════════════
    {
      id:'l6c1', level:6,
      title:'Servo Angle Controller',
      difficulty:'Medium', topic:'Functions & Servo simulation',
      description:'Simulate a servo motor controller. Write a function <code>int clampAngle(int angle)</code> that constrains an angle to 0-180 (like a real servo\'s physical limits). Then read N commands, clamp each angle, and print the servo position.',
      inputFormat:'Line 1: N (number of commands). Following N lines: one integer each (target angle).',
      outputFormat:'N lines: <code>Servo: XXX°</code> (after clamping).',
      sampleInput:'4\n90\n200\n-10\n45', sampleOutput:'Servo: 90\u00B0\nServo: 180\u00B0\nServo: 0\u00B0\nServo: 45\u00B0',
      constraints:'−1000 ≤ angle ≤ 1000, 1 ≤ N ≤ 50',
      hints:['Clamping: if angle < 0, return 0. If angle > 180, return 180. Otherwise return angle.','This is exactly what Arduino\'s <code>constrain()</code> does.'],
      solution:'#include <iostream>\nusing namespace std;\n\nint clampAngle(int angle) {\n    if (angle < 0) return 0;\n    if (angle > 180) return 180;\n    return angle;\n}\n\nint main() {\n    int n;\n    cin >> n;\n    for (int i = 0; i < n; i++) {\n        int angle;\n        cin >> angle;\n        cout << "Servo: " << clampAngle(angle) << "\\xC2\\xB0" << endl;\n    }\n    return 0;\n}',
      starterCode:'#include <iostream>\nusing namespace std;\n\nint clampAngle(int angle) {\n    // Constrain angle to 0-180 range\n}\n\nint main() {\n    int n;\n    cin >> n;\n    for (int i = 0; i < n; i++) {\n        int angle;\n        cin >> angle;\n        cout << "Servo: " << clampAngle(angle) << "\\xC2\\xB0" << endl;\n    }\n    return 0;\n}',
      commonMistakes:['Not handling negative angles','Off-by-one at boundaries (180 should be allowed)','Wrong output format'],
      edgeCases:['Angle exactly 0','Angle exactly 180','Very large positive/negative'],
      testCases:[
        { input:'4\n90\n200\n-10\n45',  expectedOutput:'Servo: 90\u00B0\nServo: 180\u00B0\nServo: 0\u00B0\nServo: 45\u00B0', desc:'Mixed angles' },
        { input:'2\n0\n180',             expectedOutput:'Servo: 0\u00B0\nServo: 180\u00B0', desc:'Boundary values' },
        { input:'1\n1000',               expectedOutput:'Servo: 180\u00B0', desc:'Very large angle' }
      ]
    },
    {
      id:'l6c2', level:6,
      title:'Sensor Conversion Library',
      difficulty:'Medium', topic:'Multiple functions',
      description:'Build a mini "sensor library" with functions:<br>• <code>int rawToVoltage(int raw)</code> — converts 0-1023 to millivolts (0-5000): <code>raw * 5000 / 1023</code><br>• <code>int voltageToTemp(int mv)</code> — TMP36 conversion: <code>(mv - 500) / 10</code><br>Read N raw values, convert each, and print: <code>Raw: X → Voltage: Ymv → Temp: Z°C</code>',
      inputFormat:'Line 1: N. Following N lines: raw analog values.',
      outputFormat:'N lines in the format: <code>Raw: X -> Voltage: Ymv -> Temp: Z°C</code>',
      sampleInput:'3\n150\n512\n1023', sampleOutput:'Raw: 150 -> Voltage: 733mv -> Temp: 23\u00B0C\nRaw: 512 -> Voltage: 2502mv -> Temp: 200\u00B0C\nRaw: 1023 -> Voltage: 5000mv -> Temp: 450\u00B0C',
      constraints:'0 ≤ raw ≤ 1023, 1 ≤ N ≤ 20',
      hints:['Write two separate functions for conversion.','Chain them: raw → voltage → temperature.','Use integer arithmetic throughout.'],
      solution:'#include <iostream>\nusing namespace std;\n\nint rawToVoltage(int raw) {\n    return raw * 5000 / 1023;\n}\n\nint voltageToTemp(int mv) {\n    return (mv - 500) / 10;\n}\n\nint main() {\n    int n;\n    cin >> n;\n    for (int i = 0; i < n; i++) {\n        int raw;\n        cin >> raw;\n        int mv = rawToVoltage(raw);\n        int temp = voltageToTemp(mv);\n        cout << "Raw: " << raw << " -> Voltage: " << mv << "mv -> Temp: " << temp << "\\xC2\\xB0C" << endl;\n    }\n    return 0;\n}',
      starterCode:'#include <iostream>\nusing namespace std;\n\nint rawToVoltage(int raw) {\n    // Convert raw (0-1023) to millivolts (0-5000)\n}\n\nint voltageToTemp(int mv) {\n    // Convert millivolts to temperature (TMP36)\n}\n\nint main() {\n    int n;\n    cin >> n;\n    for (int i = 0; i < n; i++) {\n        int raw;\n        cin >> raw;\n        int mv = rawToVoltage(raw);\n        int temp = voltageToTemp(mv);\n        cout << "Raw: " << raw << " -> Voltage: " << mv << "mv -> Temp: " << temp << "\\xC2\\xB0C" << endl;\n    }\n    return 0;\n}',
      commonMistakes:['Integer overflow with large values','Wrong formula for TMP36 conversion','Mixing up function parameter types'],
      edgeCases:['Raw value 0','Raw value 1023','Values near the 500mv threshold'],
      testCases:[
        { input:'3\n150\n512\n1023', expectedOutput:'Raw: 150 -> Voltage: 733mv -> Temp: 23\u00B0C\nRaw: 512 -> Voltage: 2502mv -> Temp: 200\u00B0C\nRaw: 1023 -> Voltage: 5000mv -> Temp: 450\u00B0C', desc:'Various readings' },
        { input:'1\n0', expectedOutput:'Raw: 0 -> Voltage: 0mv -> Temp: -50\u00B0C', desc:'Minimum raw value' },
        { input:'1\n102', expectedOutput:'Raw: 102 -> Voltage: 498mv -> Temp: 0\u00B0C', desc:'Near zero temp' }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // LEVEL 7 : ARRAYS & SENSOR DATA
    // ══════════════════════════════════════════════════════════
    {
      id:'l7c1', level:7,
      title:'Sensor Data Smoother',
      difficulty:'Hard', topic:'Arrays & Averaging',
      description:'Simulate smoothing noisy sensor data. Read N sensor values into an array, then print the "smoothed" output. Each smoothed value is the average of a sliding window of size W centered on the current index (use integer division). At the edges, use whatever values are available (partial window).',
      inputFormat:'Line 1: N W (count and window size, W is odd). Line 2: N integers (sensor readings).',
      outputFormat:'N space-separated smoothed values.',
      sampleInput:'7 3\n10 20 30 40 50 60 70', sampleOutput:'15 20 30 40 50 60 65',
      constraints:'1 ≤ W ≤ N ≤ 100, W is odd.',
      hints:['For index i, the window goes from max(0, i-W/2) to min(N-1, i+W/2).','Sum all values in the window and divide by the window count.','Integer division for the average.'],
      solution:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int n, w;\n    cin >> n >> w;\n    int arr[100];\n    for (int i = 0; i < n; i++) cin >> arr[i];\n    int half = w / 2;\n    for (int i = 0; i < n; i++) {\n        int lo = i - half;\n        if (lo < 0) lo = 0;\n        int hi = i + half;\n        if (hi >= n) hi = n - 1;\n        int sum = 0, cnt = 0;\n        for (int j = lo; j <= hi; j++) {\n            sum += arr[j];\n            cnt++;\n        }\n        if (i > 0) cout << " ";\n        cout << sum / cnt;\n    }\n    return 0;\n}',
      starterCode:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int n, w;\n    cin >> n >> w;\n    int arr[100];\n    for (int i = 0; i < n; i++) cin >> arr[i];\n    // Apply sliding window average (window size w)\n    \n    return 0;\n}',
      commonMistakes:['Not handling edges (partial windows)','Off-by-one in window bounds','Using float division instead of integer'],
      edgeCases:['Window size 1 (no smoothing)','Window size equals array size','Very noisy data'],
      testCases:[
        { input:'7 3\n10 20 30 40 50 60 70',  expectedOutput:'15 20 30 40 50 60 65', desc:'Normal smoothing' },
        { input:'5 1\n10 20 30 40 50',          expectedOutput:'10 20 30 40 50',       desc:'Window 1, no change' },
        { input:'3 3\n100 200 300',             expectedOutput:'150 200 250',          desc:'Full window' }
      ]
    },
    {
      id:'l7c2', level:7,
      title:'Pin State Logger',
      difficulty:'Hard', topic:'Arrays & Data Logging',
      description:'Simulate a data logger that records digital pin states over time. Read N time steps, each with the state of 4 pins (0 or 1). After logging, print a summary:<br>• For each pin: how many times it was HIGH<br>• Which pin was HIGH the most (if tie, lowest pin number)',
      inputFormat:'Line 1: N (number of time steps). Following N lines: 4 integers each (states of pins 0-3).',
      outputFormat:'4 lines: <code>Pin X: Y times HIGH</code>. Then: <code>Most active: Pin Z</code>',
      sampleInput:'3\n1 0 1 0\n1 1 0 0\n0 1 1 1', sampleOutput:'Pin 0: 2 times HIGH\nPin 1: 2 times HIGH\nPin 2: 2 times HIGH\nPin 3: 1 times HIGH\nMost active: Pin 0',
      constraints:'1 ≤ N ≤ 100',
      hints:['Use an array of 4 integers to count HIGH states per pin.','Loop through all readings, incrementing counts.','Find the pin with the highest count (lowest index on tie).'],
      solution:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    int counts[4] = {0, 0, 0, 0};\n    for (int i = 0; i < n; i++) {\n        for (int p = 0; p < 4; p++) {\n            int state;\n            cin >> state;\n            counts[p] += state;\n        }\n    }\n    int maxPin = 0;\n    for (int p = 0; p < 4; p++) {\n        cout << "Pin " << p << ": " << counts[p] << " times HIGH" << endl;\n        if (counts[p] > counts[maxPin]) maxPin = p;\n    }\n    cout << "Most active: Pin " << maxPin;\n    return 0;\n}',
      starterCode:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    int counts[4] = {0, 0, 0, 0};\n    // Read pin states, count HIGHs, find most active\n    \n    return 0;\n}',
      commonMistakes:['Not initializing count array to zeros','Wrong loop bounds','Tie-breaking with highest instead of lowest pin'],
      edgeCases:['All pins always HIGH','All pins always LOW','Single time step'],
      testCases:[
        { input:'3\n1 0 1 0\n1 1 0 0\n0 1 1 1', expectedOutput:'Pin 0: 2 times HIGH\nPin 1: 2 times HIGH\nPin 2: 2 times HIGH\nPin 3: 1 times HIGH\nMost active: Pin 0', desc:'Mixed states' },
        { input:'2\n0 0 0 1\n0 0 0 1', expectedOutput:'Pin 0: 0 times HIGH\nPin 1: 0 times HIGH\nPin 2: 0 times HIGH\nPin 3: 2 times HIGH\nMost active: Pin 3', desc:'Only pin 3 active' },
        { input:'1\n1 1 1 1', expectedOutput:'Pin 0: 1 times HIGH\nPin 1: 1 times HIGH\nPin 2: 1 times HIGH\nPin 3: 1 times HIGH\nMost active: Pin 0', desc:'All tied, pick lowest' }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // LEVEL 8 : ESP32 FUNDAMENTALS
    // ══════════════════════════════════════════════════════════
    {
      id:'l8c1', level:8,
      title:'ESP32 ADC Converter',
      difficulty:'Hard', topic:'ESP32 12-bit ADC',
      description:'ESP32 has a 12-bit ADC (0-4095) while Arduino has 10-bit (0-1023). Write a program that reads an ESP32 analog value and converts it to:<br>1. Voltage (0-3300 millivolts): <code>raw * 3300 / 4095</code><br>2. Equivalent Arduino value (0-1023): <code>raw * 1023 / 4095</code><br>3. Percentage (0-100): <code>raw * 100 / 4095</code>',
      inputFormat:'A single integer (ESP32 raw ADC value, 0-4095).',
      outputFormat:'Three lines:<br><code>Voltage: Xmv</code><br><code>Arduino equivalent: Y</code><br><code>Percentage: Z%</code>',
      sampleInput:'2048', sampleOutput:'Voltage: 1650mv\nArduino equivalent: 511\nPercentage: 50%',
      constraints:'0 ≤ raw ≤ 4095',
      hints:['Use integer arithmetic for all conversions.','ESP32 reference voltage is 3.3V = 3300mv.','Each conversion is just a simple proportion.'],
      solution:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int raw;\n    cin >> raw;\n    int voltage = raw * 3300 / 4095;\n    int arduino = raw * 1023 / 4095;\n    int pct = raw * 100 / 4095;\n    cout << "Voltage: " << voltage << "mv" << endl;\n    cout << "Arduino equivalent: " << arduino << endl;\n    cout << "Percentage: " << pct << "%" << endl;\n    return 0;\n}',
      starterCode:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int raw;\n    cin >> raw;\n    // Convert ESP32 ADC value (0-4095)\n    // To voltage, Arduino equivalent, and percentage\n    \n    return 0;\n}',
      commonMistakes:['Using 5000mv instead of 3300mv for ESP32','Using 1023 as max instead of 4095','Integer overflow with large values'],
      edgeCases:['Value 0','Value 4095','Mid-range value'],
      testCases:[
        { input:'2048', expectedOutput:'Voltage: 1650mv\nArduino equivalent: 511\nPercentage: 50%', desc:'Mid range' },
        { input:'0',    expectedOutput:'Voltage: 0mv\nArduino equivalent: 0\nPercentage: 0%',       desc:'Minimum' },
        { input:'4095', expectedOutput:'Voltage: 3300mv\nArduino equivalent: 1023\nPercentage: 100%', desc:'Maximum' }
      ]
    },
    {
      id:'l8c2', level:8,
      title:'WiFi Signal Classifier',
      difficulty:'Hard', topic:'ESP32 WiFi concepts',
      description:'Simulate ESP32 WiFi signal strength analysis. RSSI (Received Signal Strength Indicator) is measured in dBm. Classify the signal:<br>• <code>−30 to −50</code> dBm → <code>EXCELLENT</code><br>• <code>−51 to −60</code> dBm → <code>GOOD</code><br>• <code>−61 to −70</code> dBm → <code>FAIR</code><br>• <code>−71 to −80</code> dBm → <code>WEAK</code><br>• Below <code>−80</code> dBm → <code>NO SIGNAL</code><br>Read N RSSI values and classify each. Then print the average RSSI.',
      inputFormat:'Line 1: N. Line 2: N integers (RSSI values in dBm).',
      outputFormat:'N lines of classification, then: <code>Average RSSI: X dBm</code> (integer division).',
      sampleInput:'4\n-45 -55 -72 -90', sampleOutput:'EXCELLENT\nGOOD\nWEAK\nNO SIGNAL\nAverage RSSI: -65 dBm',
      constraints:'−120 ≤ RSSI ≤ −10. 1 ≤ N ≤ 50.',
      hints:['Use if/else chain to classify each RSSI value.','Track the sum for averaging.','Remember RSSI values are negative!'],
      solution:'#include <iostream>\n#include <string>\nusing namespace std;\n\nstring classifyRSSI(int rssi) {\n    if (rssi >= -50) return "EXCELLENT";\n    if (rssi >= -60) return "GOOD";\n    if (rssi >= -70) return "FAIR";\n    if (rssi >= -80) return "WEAK";\n    return "NO SIGNAL";\n}\n\nint main() {\n    int n;\n    cin >> n;\n    int sum = 0;\n    for (int i = 0; i < n; i++) {\n        int rssi;\n        cin >> rssi;\n        sum += rssi;\n        cout << classifyRSSI(rssi) << endl;\n    }\n    cout << "Average RSSI: " << sum / n << " dBm";\n    return 0;\n}',
      starterCode:'#include <iostream>\n#include <string>\nusing namespace std;\n\nstring classifyRSSI(int rssi) {\n    // Classify signal strength\n}\n\nint main() {\n    int n;\n    cin >> n;\n    // Read RSSI values, classify each, compute average\n    \n    return 0;\n}',
      commonMistakes:['Wrong boundary conditions with negative numbers','Forgetting that -50 > -60','Integer division rounding toward zero'],
      edgeCases:['All same strength','Mix of all categories','Single reading'],
      testCases:[
        { input:'4\n-45 -55 -72 -90', expectedOutput:'EXCELLENT\nGOOD\nWEAK\nNO SIGNAL\nAverage RSSI: -65 dBm', desc:'Mixed signals' },
        { input:'1\n-30',              expectedOutput:'EXCELLENT\nAverage RSSI: -30 dBm', desc:'Best signal' },
        { input:'3\n-65 -65 -65',     expectedOutput:'FAIR\nFAIR\nFAIR\nAverage RSSI: -65 dBm', desc:'All same' }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // LEVEL 9 : SERIAL COMMUNICATION
    // ══════════════════════════════════════════════════════════
    {
      id:'l9c1', level:9,
      title:'Serial Protocol Parser',
      difficulty:'Hard', topic:'Arduino↔ESP32 communication',
      description:'Simulate parsing structured serial messages between Arduino and ESP32. Messages use the format <code>KEY:VALUE</code> separated by commas. Parse each message and print the key-value pairs.<br>Example: <code>T:25,H:60,D:150</code> has 3 pairs.',
      inputFormat:'A single line containing comma-separated KEY:VALUE pairs.',
      outputFormat:'Each pair on its own line: <code>KEY = VALUE</code>. Then: <code>Fields: N</code>',
      sampleInput:'T:25,H:60,D:150', sampleOutput:'T = 25\nH = 60\nD = 150\nFields: 3',
      constraints:'At least 1 pair. Keys are single uppercase letters. Values are integers. No spaces.',
      hints:['Split the string by commas first.','Then split each piece by the colon.','Use <code>string::find()</code> and <code>string::substr()</code>.'],
      solution:'#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string msg;\n    cin >> msg;\n    int count = 0;\n    int start = 0;\n    while (start < (int)msg.length()) {\n        int comma = msg.find(\',\', start);\n        if (comma == (int)string::npos) comma = msg.length();\n        string pair = msg.substr(start, comma - start);\n        int colon = pair.find(\':\');\n        string key = pair.substr(0, colon);\n        string value = pair.substr(colon + 1);\n        cout << key << " = " << value << endl;\n        count++;\n        start = comma + 1;\n    }\n    cout << "Fields: " << count;\n    return 0;\n}',
      starterCode:'#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string msg;\n    cin >> msg;\n    // Parse KEY:VALUE pairs separated by commas\n    \n    return 0;\n}',
      commonMistakes:['Not handling the last pair (no trailing comma)','Off-by-one in substring extraction','Missing the field count'],
      edgeCases:['Single pair','Many pairs','Large values'],
      testCases:[
        { input:'T:25,H:60,D:150',         expectedOutput:'T = 25\nH = 60\nD = 150\nFields: 3', desc:'Three fields' },
        { input:'S:100',                     expectedOutput:'S = 100\nFields: 1', desc:'Single field' },
        { input:'A:1,B:2,C:3,D:4,E:5', expectedOutput:'A = 1\nB = 2\nC = 3\nD = 4\nE = 5\nFields: 5', desc:'Five fields' }
      ]
    },
    {
      id:'l9c2', level:9,
      title:'Command Processor',
      difficulty:'Hard', topic:'Bidirectional serial',
      description:'Simulate the ESP32 side of a bidirectional communication system. The ESP32 receives sensor data from Arduino and sends commands back.<br><br>Input: a series of messages. Messages starting with <code>DATA:</code> are sensor readings to log. Messages starting with <code>CMD:</code> are command requests that the ESP32 decides on.<br><br>For DATA messages, just print <code>Logged: KEY=VALUE</code>. For CMD messages:<br>• <code>CMD:STATUS</code> → reply <code>Reply: OK</code><br>• <code>CMD:RESET</code> → reply <code>Reply: RESETTING</code><br>• <code>CMD:READ</code> → reply <code>Reply: LAST_TEMP=X</code> (the last temperature DATA value received, or 0 if none)<br>• Other CMD → <code>Reply: UNKNOWN</code><br><br>End input with <code>END</code>.',
      inputFormat:'Multiple lines of messages, ending with <code>END</code>.',
      outputFormat:'Response for each message.',
      sampleInput:'DATA:TEMP=25\nDATA:HUM=60\nCMD:STATUS\nCMD:READ\nEND', sampleOutput:'Logged: TEMP=25\nLogged: HUM=60\nReply: OK\nReply: LAST_TEMP=25',
      constraints:'At most 100 messages.',
      hints:['Use <code>string::substr()</code> to check the prefix.','Track the last temperature value separately.','Handle CMD:READ specially using the stored temperature.'],
      solution:'#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string line;\n    int lastTemp = 0;\n    while (getline(cin, line)) {\n        if (line == "END") break;\n        if (line.substr(0, 5) == "DATA:") {\n            string payload = line.substr(5);\n            cout << "Logged: " << payload << endl;\n            // Track last temperature\n            if (payload.substr(0, 5) == "TEMP=") {\n                lastTemp = stoi(payload.substr(5));\n            }\n        } else if (line.substr(0, 4) == "CMD:") {\n            string cmd = line.substr(4);\n            if (cmd == "STATUS") cout << "Reply: OK" << endl;\n            else if (cmd == "RESET") cout << "Reply: RESETTING" << endl;\n            else if (cmd == "READ") cout << "Reply: LAST_TEMP=" << lastTemp << endl;\n            else cout << "Reply: UNKNOWN" << endl;\n        }\n    }\n    return 0;\n}',
      starterCode:'#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string line;\n    int lastTemp = 0;\n    // Process messages until END\n    \n    return 0;\n}',
      commonMistakes:['Not tracking the last temperature value','Wrong substring indices','Not handling unknown commands'],
      edgeCases:['CMD:READ before any DATA:TEMP','Multiple temperature updates','Unknown commands'],
      testCases:[
        { input:'DATA:TEMP=25\nDATA:HUM=60\nCMD:STATUS\nCMD:READ\nEND', expectedOutput:'Logged: TEMP=25\nLogged: HUM=60\nReply: OK\nReply: LAST_TEMP=25', desc:'Mixed messages' },
        { input:'CMD:READ\nEND', expectedOutput:'Reply: LAST_TEMP=0', desc:'Read before any data' },
        { input:'DATA:TEMP=10\nDATA:TEMP=30\nCMD:READ\nCMD:RESET\nCMD:BLINK\nEND', expectedOutput:'Logged: TEMP=10\nLogged: TEMP=30\nReply: LAST_TEMP=30\nReply: RESETTING\nReply: UNKNOWN', desc:'Updates and unknown' }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // LEVEL 10 : IOT FINAL BOSS
    // ══════════════════════════════════════════════════════════
    {
      id:'l10c1', level:10,
      title:'IoT Dashboard System',
      difficulty:'Boss', topic:'Full Arduino↔ESP32 System',
      description:'Build the logic for a complete IoT system. The program simulates an ESP32 receiving data from an Arduino and serving a dashboard.<br><br>Process a series of operations:<br>• <code>SENSOR name value</code> — Log a sensor reading<br>• <code>QUERY name</code> — Print latest value: <code>name: value</code> (or <code>name: N/A</code> if not logged yet)<br>• <code>ALERT name threshold</code> — Set alert threshold. After this, any SENSOR reading for that name that exceeds the threshold prints <code>ALERT: name exceeded threshold! (value=X)</code><br>• <code>STATS</code> — Print count of unique sensors and total readings<br>• <code>EXIT</code> — Print <code>System shutdown.</code> and stop<br><br>This simulates a real ESP32 web dashboard backend!',
      inputFormat:'Multiple lines of operations, ending with EXIT.',
      outputFormat:'Responses for each operation as described.',
      sampleInput:'SENSOR temp 25\nSENSOR humidity 60\nSENSOR temp 35\nQUERY temp\nQUERY pressure\nALERT temp 30\nSENSOR temp 32\nSTATS\nEXIT',
      sampleOutput:'Logged: temp=25\nLogged: humidity=60\nLogged: temp=35\ntemp: 35\npressure: N/A\nAlert set: temp > 30\nLogged: temp=32\nALERT: temp exceeded 30! (value=32)\nSensors: 2 | Readings: 4\nSystem shutdown.',
      constraints:'At most 200 operations. Sensor names are single lowercase words. Values are integers.',
      hints:['Use arrays or maps to store sensor names, latest values, and alert thresholds.','Keep a count of total readings and unique sensors.','Check alert conditions AFTER logging a new sensor value.','Use parallel arrays: names[], values[], thresholds[] with a count variable.'],
      solution:'#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    const int MAX = 50;\n    string names[MAX];\n    int values[MAX];\n    int thresholds[MAX];\n    bool hasThreshold[MAX];\n    int sensorCount = 0;\n    int totalReadings = 0;\n\n    auto findSensor = [&](string name) -> int {\n        for (int i = 0; i < sensorCount; i++)\n            if (names[i] == name) return i;\n        return -1;\n    };\n\n    string op;\n    while (cin >> op) {\n        if (op == "EXIT") {\n            cout << "System shutdown." << endl;\n            break;\n        }\n        if (op == "SENSOR") {\n            string name; int val;\n            cin >> name >> val;\n            int idx = findSensor(name);\n            if (idx == -1) {\n                idx = sensorCount++;\n                names[idx] = name;\n                hasThreshold[idx] = false;\n            }\n            values[idx] = val;\n            totalReadings++;\n            cout << "Logged: " << name << "=" << val << endl;\n            if (hasThreshold[idx] && val > thresholds[idx]) {\n                cout << "ALERT: " << name << " exceeded " << thresholds[idx] << "! (value=" << val << ")" << endl;\n            }\n        } else if (op == "QUERY") {\n            string name;\n            cin >> name;\n            int idx = findSensor(name);\n            if (idx == -1) cout << name << ": N/A" << endl;\n            else cout << name << ": " << values[idx] << endl;\n        } else if (op == "ALERT") {\n            string name; int thresh;\n            cin >> name >> thresh;\n            int idx = findSensor(name);\n            if (idx == -1) {\n                idx = sensorCount++;\n                names[idx] = name;\n                values[idx] = 0;\n            }\n            thresholds[idx] = thresh;\n            hasThreshold[idx] = true;\n            cout << "Alert set: " << name << " > " << thresh << endl;\n        } else if (op == "STATS") {\n            cout << "Sensors: " << sensorCount << " | Readings: " << totalReadings << endl;\n        }\n    }\n    return 0;\n}',
      starterCode:'#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    // IoT Dashboard System\n    // Handle: SENSOR, QUERY, ALERT, STATS, EXIT\n    // Use arrays to store sensor data\n    \n    return 0;\n}',
      commonMistakes:['Not checking alert thresholds after logging','Counting unique sensors wrong','Not handling QUERY for unknown sensors','Forgetting to update the value when a sensor reports again'],
      edgeCases:['Query before any data','Alert set before sensor exists','Multiple alerts triggered','Stats with no data'],
      testCases:[
        {
          input:'SENSOR temp 25\nSENSOR humidity 60\nSENSOR temp 35\nQUERY temp\nQUERY pressure\nALERT temp 30\nSENSOR temp 32\nSTATS\nEXIT',
          expectedOutput:'Logged: temp=25\nLogged: humidity=60\nLogged: temp=35\ntemp: 35\npressure: N/A\nAlert set: temp > 30\nLogged: temp=32\nALERT: temp exceeded 30! (value=32)\nSensors: 2 | Readings: 4\nSystem shutdown.',
          desc:'Full workflow'
        },
        {
          input:'QUERY temp\nSTATS\nEXIT',
          expectedOutput:'temp: N/A\nSensors: 0 | Readings: 0\nSystem shutdown.',
          desc:'Empty system'
        },
        {
          input:'SENSOR dist 100\nALERT dist 50\nSENSOR dist 45\nSENSOR dist 55\nEXIT',
          expectedOutput:'Logged: dist=100\nAlert set: dist > 50\nLogged: dist=45\nLogged: dist=55\nALERT: dist exceeded 50! (value=55)\nSystem shutdown.',
          desc:'Alert triggered on second reading'
        }
      ]
    }
  ]
};
