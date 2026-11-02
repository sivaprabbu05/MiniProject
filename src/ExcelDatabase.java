import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**

* Stores irrigation history in a CSV file.
* Uses only built-in Java classes; no external libraries required.
  */
  public class ExcelDatabase {

  private static final String[] HEADERS = {
  "Timestamp",
  "Zone Name",
  "Zone Type",
  "Plant/Crop Name",
  "Area (acres)",
  "Soil Moisture (%)",
  "Water Rate (litres/acre)",
  "Required Water (L)",
  "Priority Score",
  "Allocated Water (L)",
  "Irrigation Status",
  "Available Water at Start (L)",
  "Total Required Water for the Run (L)",
  "Total Allocated Water for the Run (L)",
  "Remaining Water (L)"
  };

  private final Path file;

  public ExcelDatabase(String filename) {
  this.file = Paths.get(filename).toAbsolutePath();
  }

  /**

  * Appends one row per irrigation zone.
  * Creates the CSV file and header automatically on the first run.
    */
    public void appendIrrigationRecords(
    Iterable<IrrigationZone> zones,
    double availableWaterAtStart,
    double totalRequired,
    double totalAllocated,
    double remainingWater) throws IOException {

    Path parent = file.getParent();

    if (parent != null) {
    Files.createDirectories(parent);
    }

    boolean needsHeader =
    !Files.exists(file) || Files.size(file) == 0;

    try (BufferedWriter writer = Files.newBufferedWriter(
    file,
    StandardCharsets.UTF_8,
    StandardOpenOption.CREATE,
    StandardOpenOption.APPEND)) {


     if (needsHeader) {
         writeRow(writer, HEADERS);
     }

     String timestamp = LocalDateTime.now().format(
             DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

     for (IrrigationZone zone : zones) {
         String zoneType =
                 zone instanceof AgriculturalField
                 ? "Agricultural Field"
                 : "Campus Plant Zone";

         double area = zone.getArea();

         double waterRate = area > 0
                 ? zone.getTotalWaterRequirement() / area
                 : 0.0;

         String status = statusFor(zone);

         String[] values = {
             timestamp,
             zone.getZoneName(),
             zoneType,
             zone.getPlantName(),
             String.valueOf(area),
             String.valueOf(zone.getSoilMoisture()),
             String.valueOf(waterRate),
             String.valueOf(zone.getTotalWaterRequirement()),
             String.valueOf(zone.getPriorityScore()),
             String.valueOf(zone.getAllocatedWater()),
             status,
             String.valueOf(availableWaterAtStart),
             String.valueOf(totalRequired),
             String.valueOf(totalAllocated),
             String.valueOf(Math.max(0.0, remainingWater))
         };

         writeRow(writer, values);
     }
  

    }

    System.out.println("Irrigation history saved to: " + file);
    }

  private static void writeRow(
  BufferedWriter writer, String[] values) throws IOException {


   for (int i = 0; i < values.length; i++) {
       if (i > 0) {
           writer.write(',');
       }

       String value = values[i] == null ? "" : values[i];

       // Escape quotes and fields containing commas or newlines.
       if (value.contains(",") || value.contains("\"")
               || value.contains("\n") || value.contains("\r")) {
           writer.write('"');
           writer.write(value.replace("\"", "\"\""));
           writer.write('"');
       } else {
           writer.write(value);
       }
   }

   writer.newLine();
  

  }

  private static String statusFor(IrrigationZone zone) {
  double required = zone.getTotalWaterRequirement();
  double allocated = zone.getAllocatedWater();


   if (allocated >= required) {
       return "FULLY IRRIGATED";
   }

   if (allocated > 0.0) {
       return "PARTIALLY IRRIGATED";
   }

   return "WAITING";

  }
  }
