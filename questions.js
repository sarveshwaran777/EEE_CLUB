const QUIZ_QUESTIONS = [
  {
    "id": 1,
    "category": "Diodes & Semiconductors",
    "question": "A circuit requires converting light intensity directly into electrical current. Which diode should be selected?",
    "options": {
      "A": "Zener diode",
      "B": "LED",
      "C": "Photodiode",
      "D": "Varactor diode"
    },
    "answer": "C"
  },
  {
    "id": 2,
    "category": "Diodes & Semiconductors",
    "question": "A diode is connected in series with a DC source and a resistor. The measured voltage across the diode is 0 V. Which statement is definitely true?",
    "options": {
      "A": "Diode is short-circuited",
      "B": "Diode is forward biased and ideal",
      "C": "No current flows through the circuit",
      "D": "Cannot be determined from the given information"
    },
    "answer": "B"
  },
  {
    "id": 3,
    "category": "Diodes & Semiconductors",
    "question": "A silicon diode and a germanium diode are connected in parallel and supplied with 0.4 V. Which diode conducts more current?",
    "options": {
      "A": "Silicon diode",
      "B": "Germanium diode",
      "C": "Both equally",
      "D": "Neither conducts"
    },
    "answer": "B"
  },
  {
    "id": 4,
    "category": "Circuit Protection",
    "question": "A diode is used in a circuit , but removing it does not affect DC operation. Why might it still be present?",
    "options": {
      "A": "Voltage amplification",
      "B": "Protection against transient voltages",
      "C": "Current generation",
      "D": "Frequency multiplication"
    },
    "answer": "B"
  },
  {
    "id": 5,
    "category": "Rectifiers",
    "question": "A bridge rectifier contains four identical diodes. If one diode becomes open, the output becomes:",
    "options": {
      "A": "Pure DC",
      "B": "Full-wave DC with lower voltage",
      "C": "Half-wave DC",
      "D": "Zero voltage"
    },
    "answer": "C"
  },
  {
    "id": 6,
    "category": "Diodes & Breakdown",
    "question": "A diode is reverse biased. Increasing reverse voltage further will:",
    "options": {
      "A": "Always increase reverse current significantly",
      "B": "Never change current",
      "C": "Cause breakdown only after a certain voltage",
      "D": "Make the diode emit light"
    },
    "answer": "C"
  },
  {
    "id": 7,
    "category": "Ideal Diodes",
    "question": "Which statement is TRUE for an ideal diode?",
    "options": {
      "A": "Infinite forward resistance and zero reverse resistance",
      "B": "Zero forward resistance and infinite reverse resistance",
      "C": "Infinite resistance in both directions",
      "D": "Zero resistance in both directions"
    },
    "answer": "B"
  },
  {
    "id": 8,
    "category": "Rectifiers",
    "question": "In a full-wave bridge rectifier, current passes through:",
    "options": {
      "A": "One diode per half-cycle",
      "B": "Two diodes per half-cycle",
      "C": "Three diodes per half-cycle",
      "D": "Four diodes per half-cycle"
    },
    "answer": "B"
  },
  {
    "id": 9,
    "category": "Optoelectronics",
    "question": "An LED is connected directly across a 12 V battery without a resistor. Most likely result?",
    "options": {
      "A": "LED glows brighter forever",
      "B": "LED behaves as a Zener diode",
      "C": "LED gets damaged due to excessive current",
      "D": "Nothing happens"
    },
    "answer": "C"
  },
  {
    "id": 10,
    "category": "Zener Diodes",
    "question": "A Zener diode rated at 5.1 V is connected in forward bias. Its voltage drop is approximately:",
    "options": {
      "A": "5.1 V",
      "B": "0.7 V",
      "C": "0 V",
      "D": "Infinite"
    },
    "answer": "B"
  },
  {
    "id": 11,
    "category": "Diode Applications",
    "question": "Which application uses the diode as a switch rather than a rectifier?",
    "options": {
      "A": "Clipping circuit",
      "B": "Power supply rectifier",
      "C": "Battery charger",
      "D": "Transformer"
    },
    "answer": "A"
  },
  {
    "id": 12,
    "category": "Diode Characteristics",
    "question": "A diode is connected in reverse bias and current is flowing through it. Which statement is definitely true?",
    "options": {
      "A": "The diode is damaged",
      "B": "The diode is a Zener operating in breakdown",
      "C": "The diode is forward biased internally",
      "D": "Cannot be determined from the given information"
    },
    "answer": "D"
  },
  {
    "id": 13,
    "category": "Diode Testing",
    "question": "A silicon diode shows exactly 0.7V across its terminals. Which statement must be true?",
    "options": {
      "A": "The diode is ON",
      "B": "The diode is healthy",
      "C": "Current is flowing",
      "D": "None of the above"
    },
    "answer": "D"
  },
  {
    "id": 14,
    "category": "Protection Circuits",
    "question": "A diode in a circuit never conducts during normal operation but conducts during abnormal conditions. It is most likely:",
    "options": {
      "A": "A flyback diode",
      "B": "A protection diode",
      "C": "A clamp diode",
      "D": "Any of the above"
    },
    "answer": "D"
  },
  {
    "id": 15,
    "category": "Parallel Components",
    "question": "Two identical silicon diodes are connected in parallel. One carries more current than the other. The most likely reason is:",
    "options": {
      "A": "Manufacturing tolerance",
      "B": "Temperature difference",
      "C": "Different forward voltage characteristics",
      "D": "All of the above"
    },
    "answer": "D"
  },
  {
    "id": 16,
    "category": "Relay Protection",
    "question": "A diode is placed across a relay coil. During normal operation it is:",
    "options": {
      "A": "Forward biased",
      "B": "Reverse biased",
      "C": "Open circuit and disconnected",
      "D": "Acting as a resistor"
    },
    "answer": "B"
  },
  {
    "id": 17,
    "category": "Diode Applications",
    "question": "Which diode application does NOT primarily involve AC to DC conversion?",
    "options": {
      "A": "Bridge rectifier",
      "B": "Half-wave rectifier",
      "C": "Flyback protection",
      "D": "Full-wave rectifier"
    },
    "answer": "C"
  },
  {
    "id": 18,
    "category": "Bridge Rectifiers",
    "question": "A bridge rectifier contains four diodes. How many conduct simultaneously?",
    "options": {
      "A": "1",
      "B": "2",
      "C": "3",
      "D": "4"
    },
    "answer": "B"
  },
  {
    "id": 19,
    "category": "Relay Circuits",
    "question": "Removing a flyback diode from a relay circuit mainly affects:",
    "options": {
      "A": "Relay resistance",
      "B": "Supply voltage",
      "C": "Switching transients",
      "D": "Relay coil turns"
    },
    "answer": "C"
  },
  {
    "id": 20,
    "category": "Integrated Circuits",
    "question": "In an integrated circuit, a capacitor is commonly realized using:",
    "options": {
      "A": "Metal-Insulator-Metal (MIM) structure",
      "B": "Transformer core",
      "C": "Relay contacts",
      "D": "Copper coil"
    },
    "answer": "A"
  },
  {
    "id": 21,
    "category": "Datasheets",
    "question": "The Min, Typ, and Max values in a datasheet represent:",
    "options": {
      "A": "Manufacturing cost",
      "B": "Operating limits and expected parameter variations",
      "C": "Packaging dimensions",
      "D": "Product version numbers"
    },
    "answer": "B"
  },
  {
    "id": 22,
    "category": "Parallel Loads",
    "question": "Five bulbs are rated at 10 V, 1 A each. If all are connected in parallel, what is the minimum supply rating required?",
    "options": {
      "A": "10 V, 1 A",
      "B": "10 V, 2 A",
      "C": "10 V, 5 A",
      "D": "50 V, 1 A"
    },
    "answer": "C"
  },
  {
    "id": 23,
    "category": "Power Calculations",
    "question": "A power supply delivers a maximum of 20 V and 0.5 A. What is the maximum output power?",
    "options": {
      "A": "5 W",
      "B": "10 W",
      "C": "20 W",
      "D": "40 W"
    },
    "answer": "B"
  },
  {
    "id": 24,
    "category": "Op-Amp Fundamentals",
    "question": "Which of the following is an ideal characteristic of an operational amplifier (Op-Amp)?",
    "options": {
      "A": "Infinite output impedance",
      "B": "Infinite input impedance",
      "C": "Zero voltage gain",
      "D": "Infinite input current"
    },
    "answer": "B"
  },
  {
    "id": 25,
    "category": "Power Supply Operation",
    "question": "Auto Crossover in a programmable power supply occurs when:",
    "options": {
      "A": "The supply automatically switches between Constant Voltage (CV) and Constant Current (CC) modes.",
      "B": "The supply changes from AC to DC.",
      "C": "The polarity reverses automatically.",
      "D": "The output frequency changes."
    },
    "answer": "A"
  },
  {
    "id": 26,
    "category": "Power Supply Specifications",
    "question": "If a DC power supply cannot generate exactly 12.63 V because of its programming step size, the limiting specification is:",
    "options": {
      "A": "Output Power",
      "B": "Resolution",
      "C": "Current Rating",
      "D": "Efficiency"
    },
    "answer": "B"
  },
  {
    "id": 27,
    "category": "Measurement Techniques",
    "question": "How does a digital multimeter measure resistance?",
    "options": {
      "A": "By measuring frequency",
      "B": "By applying a known current (or voltage) and calculating resistance using Ohm's Law",
      "C": "By measuring magnetic flux",
      "D": "By counting pulses"
    },
    "answer": "B"
  },
  {
    "id": 28,
    "category": "Digital Signals",
    "question": "A digital signal has a period of 8ns. Its operating frequency is:",
    "options": {
      "A": "80MHz",
      "B": "100MHz",
      "C": "125MHz",
      "D": "250MHz"
    },
    "answer": "C"
  },
  {
    "id": 29,
    "category": "MOSFETs",
    "question": "A MOSFET threshold voltage is 1.8V. Gate voltage = 1.5V. The MOSFET will be:",
    "options": {
      "A": "Fully ON",
      "B": "OFF",
      "C": "Breakdown",
      "D": "Saturate"
    },
    "answer": "B"
  },
  {
    "id": 30,
    "category": "Fault Analysis",
    "question": "A bridge rectifier has one diode short-circuited. The output will be:",
    "options": {
      "A": "Half-wave DC",
      "B": "Full-wave DC",
      "C": "Zero volts",
      "D": "Depends on which diode is shorted"
    },
    "answer": "D"
  },
  {
    "id": 31,
    "category": "Continuity Testing",
    "question": "During continuity testing of an IC pin, the measured resistance is nearly zero. Most likely condition is:",
    "options": {
      "A": "Open pin",
      "B": "Floating pin",
      "C": "Short circuit",
      "D": "Reverse leakage"
    },
    "answer": "C"
  },
  {
    "id": 32,
    "category": "Measurements",
    "question": "What is the primary disadvantage of a 2-wire resistance measurement?",
    "options": {
      "A": "High measurement speed",
      "B": "Lead resistance introduces measurement error",
      "C": "Requires four terminals",
      "D": "Cannot measure voltage"
    },
    "answer": "B"
  },
  {
    "id": 33,
    "category": "Digital Fundamentals",
    "question": "A digital signal contains:",
    "options": {
      "A": "Infinite voltage levels",
      "B": "Continuously varying voltage",
      "C": "Discrete voltage levels representing binary data",
      "D": "Only sinusoidal waves"
    },
    "answer": "C"
  },
  {
    "id": 34,
    "category": "Digital Logic",
    "question": "Which logic gate produces HIGH output only when all inputs are HIGH?",
    "options": {
      "A": "OR Gate",
      "B": "XOR Gate",
      "C": "NAND Gate",
      "D": "AND Gate"
    },
    "answer": "D"
  },
  {
    "id": 35,
    "category": "Digital Waveforms",
    "question": "The binary sequence 0 1 0 1 1 0 is represented in a waveform by:",
    "options": {
      "A": "Analog voltage variation",
      "B": "Alternate HIGH and LOW logic levels",
      "C": "Sinusoidal waveform",
      "D": "Constant DC voltage"
    },
    "answer": "B"
  },
  {
    "id": 36,
    "category": "IC Design & Packaging",
    "question": "Why are several VDD pins often placed close together in an IC package?",
    "options": {
      "A": "To simplify PCB routing only",
      "B": "To supply high-current functional blocks efficiently",
      "C": "To reduce the number of I/O pins",
      "D": "To increase clock speed"
    },
    "answer": "B"
  },
  {
    "id": 37,
    "category": "VLSI Design",
    "question": "Why are multiple Ground (GND) pins provided in a VLSI chip?",
    "options": {
      "A": "To increase output voltage",
      "B": "To provide a low-impedance return path and reduce electrical noise",
      "C": "To reduce clock frequency",
      "D": "To increase resistance"
    },
    "answer": "B"
  },
  {
    "id": 38,
    "category": "Circuit Protection",
    "question": "A diode is connected in a circuit. The circuit works normally. The diode is removed. The circuit still works normally. What was the diode doing?",
    "options": {
      "A": "Rectification",
      "B": "Protection",
      "C": "Voltage regulation",
      "D": "Cannot be determined"
    },
    "answer": "D"
  },
  {
    "id": 39,
    "category": "Diode Breakdown",
    "question": "A diode is reverse biased and current is flowing through it. The diode is:",
    "options": {
      "A": "Faulty",
      "B": "Zener diode",
      "C": "In breakdown",
      "D": "Any of the above"
    },
    "answer": "D"
  },
  {
    "id": 40,
    "category": "Parallel Semiconductors",
    "question": "A silicon diode and a germanium diode are connected in parallel. Which one carries more current first?",
    "options": {
      "A": "Silicon",
      "B": "Germanium",
      "C": "Equal Current",
      "D": "Depends on temperature"
    },
    "answer": "B"
  },
  {
    "id": 41,
    "category": "Special Diodes",
    "question": "A diode is used but neither rectifies AC nor regulates voltage. What is its likely purpose?",
    "options": {
      "A": "Flyback Protection",
      "B": "Clipper",
      "C": "Rectifier",
      "D": "Voltage Multiplier"
    },
    "answer": "A"
  },
  {
    "id": 42,
    "category": "Diode Physics",
    "question": "The same diode is used in a rectifier, clipper, clamper, and protection circuit. Which property is being utilized?",
    "options": {
      "A": "Unidirectional conduction",
      "B": "Light emission",
      "C": "Negative resistance",
      "D": "Variable capacitance"
    },
    "answer": "A"
  },
  {
    "id": 43,
    "category": "Power Supplies",
    "question": "A power supply is set to 10V with a current limit of 100mA. A 1Ω load is connected. What will the supply operate as?",
    "options": {
      "A": "Constant Voltage Source",
      "B": "Constant Current Source",
      "C": "Open Circuit",
      "D": "Short Circuit"
    },
    "answer": "B"
  },
  {
    "id": 44,
    "category": "Series Circuits",
    "question": "A 60W, 120V bulb and a 120W, 120V bulb are connected in series. Which glows brighter?",
    "options": {
      "A": "60W bulb",
      "B": "120W bulb",
      "C": "Both equal",
      "D": "Cannot determine"
    },
    "answer": "A"
  },
  {
    "id": 45,
    "category": "Multimeters",
    "question": "A multimeter shows '60000 counts'. What is the maximum reading?",
    "options": {
      "A": "60000.0 exactly",
      "B": "59999",
      "C": "60001",
      "D": "Depends on range"
    },
    "answer": "D"
  },
  {
    "id": 46,
    "category": "Lead Resistance Error",
    "question": "A 10Ω resistor is measured using a 2-wire method with lead resistance of 0.5Ω per lead. The meter displays:",
    "options": {
      "A": "10Ω",
      "B": "10.5Ω",
      "C": "11Ω",
      "D": "9Ω"
    },
    "answer": "C"
  },
  {
    "id": 47,
    "category": "Digital Drivers",
    "question": "A digital output can source 4mA and sink 20mA. Which state can drive more loads?",
    "options": {
      "A": "HIGH",
      "B": "LOW",
      "C": "Both equal",
      "D": "Depends on VCC"
    },
    "answer": "B"
  },
  {
    "id": 48,
    "category": "Voltage Dividers",
    "question": "Observe the Circuit: The circuit is intended to provide 3.3V, 10mA to a digital circuit from a 5V source. What is the correct identification of the circuit?",
    "options": {
      "A": "Current Divider",
      "B": "Voltage Divider",
      "C": "RC Filter",
      "D": "Current Limiter"
    },
    "answer": "B"
  },
  {
    "id": 49,
    "category": "Circuit Calculations",
    "question": "Observe the Circuit: For the circuit (Vin=5V, Vout=3.3V, Iout=10mA, R2 load), the current through R1 is:",
    "options": {
      "A": "7mA",
      "B": "10mA",
      "C": "17mA",
      "D": "27mA"
    },
    "answer": "C"
  },
  {
    "id": 50,
    "category": "Circuit Calculations",
    "question": "Observe the Circuit: For Vin=5V and Vout=3.3V with 17mA current through R1, the approximate value of R1 is:",
    "options": {
      "A": "100Ω",
      "B": "220Ω",
      "C": "330Ω",
      "D": "470Ω"
    },
    "answer": "A"
  },
  {
    "id": 51,
    "category": "Power Supply Loading",
    "question": "A power supply is programmed for 5V, 1A current limit. A DUT draws only 50mA. The supply delivers:",
    "options": {
      "A": "1A",
      "B": "5A",
      "C": "50mA",
      "D": "Cannot determine"
    },
    "answer": "C"
  },
  {
    "id": 52,
    "category": "Power Supply Modes",
    "question": "A supply is programmed for 5V, 100mA limit. A 1Ω resistor is connected. Supply operates in:",
    "options": {
      "A": "Constant Voltage mode",
      "B": "Constant Current mode",
      "C": "Auto OFF mode",
      "D": "Short Circuit mode"
    },
    "answer": "B"
  },
  {
    "id": 53,
    "category": "DUT Stress",
    "question": "Which damages a DUT (Device Under Test) first?",
    "options": {
      "A": "Exceeding voltage rating",
      "B": "Exceeding current rating",
      "C": "Exceeding power rating",
      "D": "Any of the above"
    },
    "answer": "D"
  },
  {
    "id": 54,
    "category": "Multimeter Resolution",
    "question": "A 60000-count meter is set to the 6V range. Best resolution is approximately:",
    "options": {
      "A": "1V",
      "B": "0.1V",
      "C": "0.0001V",
      "D": "0.01V"
    },
    "answer": "C"
  },
  {
    "id": 55,
    "category": "2-Wire Measurement",
    "question": "Lead resistance = 0.5Ω each. Actual resistor = 1Ω. Measured using 2-wire method. Meter reads approximately:",
    "options": {
      "A": "1Ω",
      "B": "1.5Ω",
      "C": "2Ω",
      "D": "0.5Ω"
    },
    "answer": "C"
  },
  {
    "id": 56,
    "category": "4-Wire Sensing",
    "question": "Why is 4-wire measurement preferred for low resistances?",
    "options": {
      "A": "Lower voltage",
      "B": "Higher current",
      "C": "Eliminates lead resistance error",
      "D": "Lower power"
    },
    "answer": "C"
  },
  {
    "id": 57,
    "category": "Logic Gates",
    "question": "Both inputs of an AND gate are shorted together. The gate behaves like:",
    "options": {
      "A": "NOT Gate",
      "B": "OR Gate",
      "C": "Buffer",
      "D": "NAND Gate"
    },
    "answer": "C"
  },
  {
    "id": 58,
    "category": "Sequential Logic",
    "question": "A D Flip-Flop violates setup time. Output becomes:",
    "options": {
      "A": "0",
      "B": "1",
      "C": "High-Z",
      "D": "Unpredictable"
    },
    "answer": "D"
  },
  {
    "id": 59,
    "category": "Timing Parameters",
    "question": "Which timing parameter limits maximum clock frequency?",
    "options": {
      "A": "Rise Time",
      "B": "Fall Time",
      "C": "Propagation Delay",
      "D": "Duty Cycle"
    },
    "answer": "C"
  },
  {
    "id": 60,
    "category": "Digital Output Types",
    "question": "A datasheet specifies VOL but not VOH. Most likely output type:",
    "options": {
      "A": "Push-Pull",
      "B": "Open Collector/Open Drain",
      "C": "Analog Output",
      "D": "Differential Output"
    },
    "answer": "B"
  },
  {
    "id": 61,
    "category": "Datasheet Ratings",
    "question": "Absolute Maximum Rating means:",
    "options": {
      "A": "Recommended operating value",
      "B": "Typical operating value",
      "C": "Exceeding may permanently damage device",
      "D": "Guaranteed performance point"
    },
    "answer": "C"
  },
  {
    "id": 62,
    "category": "Diode Diagnostics",
    "question": "A diode measures: Forward = 0.68V, Reverse = OL. What is its condition?",
    "options": {
      "A": "Shorted",
      "B": "Open",
      "C": "Healthy",
      "D": "Leaky"
    },
    "answer": "C"
  },
  {
    "id": 63,
    "category": "High-Speed Testing",
    "question": "A Pattern Generator is specified at 500 MHz. Rise time = 10ns. Which parameter limits high-speed testing?",
    "options": {
      "A": "Frequency only",
      "B": "Rise Time only",
      "C": "Both",
      "D": "Neither"
    },
    "answer": "C"
  },
  {
    "id": 64,
    "category": "Series Bulbs",
    "question": "Two bulbs (60W, 120V and 120W, 120V) are connected in series. Which glows brighter?",
    "options": {
      "A": "60W bulb",
      "B": "120W bulb",
      "C": "Same brightness",
      "D": "Cannot determine"
    },
    "answer": "A"
  },
  {
    "id": 65,
    "category": "Current Consumption",
    "question": "A digital IC consumes: 10mA at 5V. Power supply setting: 5V, Current limit = 5A. Actual current drawn is:",
    "options": {
      "A": "5A",
      "B": "10mA",
      "C": "2.5A",
      "D": "Depends on cable"
    },
    "answer": "B"
  },
  {
    "id": 66,
    "category": "Power Supply Modes",
    "question": "A power supply is set to Voltage = 10V, Current Limit = 100mA. A 1kΩ resistor is connected. The supply operates in:",
    "options": {
      "A": "Constant Current Mode",
      "B": "Constant Voltage Mode",
      "C": "Auto Crossover Mode",
      "D": "Short Circuit Mode"
    },
    "answer": "B"
  },
  {
    "id": 67,
    "category": "DUT Current Flow",
    "question": "A DUT requires: 5V, 20mA. Power supply setting: 5V, 5A Current Limit. What current flows?",
    "options": {
      "A": "5A",
      "B": "20mA",
      "C": "2.5A",
      "D": "Depends on cable resistance"
    },
    "answer": "B"
  },
  {
    "id": 68,
    "category": "Series Power",
    "question": "A 60W, 120V bulb and a 120W, 120V bulb are connected in series. Which statement is TRUE?",
    "options": {
      "A": "120W bulb glows brighter because it is higher wattage",
      "B": "60W bulb glows brighter because it has higher resistance",
      "C": "Both glow equally",
      "D": "Neither glows"
    },
    "answer": "B"
  },
  {
    "id": 69,
    "category": "Open Switches",
    "question": "A 5V power supply is connected to a circuit through a switch. The switch is OPEN. What is the voltage across the switch?",
    "options": {
      "A": "0V",
      "B": "2.5V",
      "C": "5V",
      "D": "Cannot be determined"
    },
    "answer": "C"
  },
  {
    "id": 70,
    "category": "Logic Compatibility",
    "question": "A digital IC has VOH = 4.5V, VIH(min) = 3.5V. Can the output directly drive the input?",
    "options": {
      "A": "No",
      "B": "Yes",
      "C": "Only with pull-up resistor",
      "D": "Only at room temperature"
    },
    "answer": "B"
  },
  {
    "id": 71,
    "category": "Capacitor Transient Response",
    "question": "A capacitor voltage cannot change instantaneously because:",
    "options": {
      "A": "Current is limited",
      "B": "Infinite current would be required",
      "C": "Voltage source prevents it",
      "D": "Resistance prevents it"
    },
    "answer": "B"
  },
  {
    "id": 72,
    "category": "Multimeter Characteristics",
    "question": "A multimeter measures voltage by behaving approximately as:",
    "options": {
      "A": "Short Circuit",
      "B": "Open Circuit",
      "C": "Current Source",
      "D": "Voltage Source"
    },
    "answer": "B"
  },
  {
    "id": 73,
    "category": "AC Circuits & Inductors",
    "question": "A coil of inductance 100 mH and series resistance 100 Ω is connected across a 20 V, 1 kHz AC supply. The quality factor of the coil at 1 kHz is:",
    "options": {
      "A": "π",
      "B": "2π",
      "C": "10⁻³",
      "D": "1"
    },
    "answer": "B"
  },
  {
    "id": 74,
    "category": "Protection & Relays",
    "question": "Consider the two statements given below, and select the correct option.\nStatement 1: A directional relay relies on the principle that the CT currents due to a fault located on either side of the CT always differ from each other by a phase angle of 90°.\nStatement 2: Directional relays are generally deployed in distribution feeders, with their operating direction set towards the source/substation.",
    "options": {
      "A": "Both the Statements are FALSE.",
      "B": "Both the Statements are TRUE.",
      "C": "Statement 1 is FALSE, while Statement 2 is TRUE.",
      "D": "Statement 1 is TRUE, while Statement 2 is FALSE."
    },
    "answer": "A"
  },
  {
    "id": 75,
    "category": "Semiconductor Overview",
    "question": "What is the primary purpose of introducing dopants into a pure semiconductor crystal?",
    "options": {
      "A": "To increase the melting point of the crystal structure.",
      "B": "To control and increase its electrical conductivity by creating excess free electrons (N-type) or holes (P-type).",
      "C": "To turn the semiconductor into a perfect electrical insulator.",
      "D": "To change the color of the wafer for inspection."
    },
    "answer": "B"
  }
];
