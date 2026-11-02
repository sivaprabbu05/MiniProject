import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/** Saves irrigation runs to a plain CSV file using only the Java standard library. */
public class IrrigationHistory {
    private static final String[] HEADERS = {
        "Timestamp", "Zone Name", "Zone Type", "Plant/Crop Name", "Area (acres)",
        "Soil Moisture (%)", "Water Rate (litres/acre)", "Required Water (L)",
        "Priority Score", "Allocated Water (L)", "Irrigation Status",
        "Available Water at Start (L)", "Total Required Water for the Run (L)",
        "Total Allocated Water for the Run (L)", "Remaining Water (L)"
    };

    private final Path file;

    public IrrigationHistory(String filename) {
        this.file = Paths.get(filename).toAbsolutePath();
    }

    /** Appends one row per zone, preserving all previous history. */
    public void appendIrrigationRecords(Iterable<IrrigationZone> zones,
            double availableWaterAtStart, double totalRequired,
            double totalAllocated, double remainingWater) throws IOException {
        Path parent = file.getParent();
        if (parent != null) Files.createDirectories(parent);

        boolean needsHeader = !Files.exists(file) || Files.size(file) == 0;
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        try (BufferedWriter writer = Files.newBufferedWriter(file, StandardCharsets.UTF_8,
                StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.APPEND)) {
            if (needsHeader) {
                writeRow(writer, HEADERS);
            }

            for (IrrigationZone zone : zones) {
                String zoneType = zone instanceof AgriculturalField
                        ? "Agricultural Field" : "Campus Plant Zone";
                double rate = zone.getArea() > 0.0
                        ? zone.getTotalWaterRequirement() / zone.getArea() : 0.0;

                List<String> values = new ArrayList<>();
                values.add(timestamp);
                values.add(zone.getZoneName());
                values.add(zoneType);
                values.add(zone.getPlantName());
                values.add(Double.toString(zone.getArea()));
                values.add(Double.toString(zone.getSoilMoisture()));
                values.add(Double.toString(rate));
                values.add(Double.toString(zone.getTotalWaterRequirement()));
                values.add(Double.toString(zone.getPriorityScore()));
                values.add(Double.toString(zone.getAllocatedWater()));
                values.add(statusFor(zone));
                values.add(Double.toString(availableWaterAtStart));
                values.add(Double.toString(totalRequired));
                values.add(Double.toString(totalAllocated));
                values.add(Double.toString(Math.max(0.0, remainingWater)));
                writeRow(writer, values.toArray(new String[0]));
            }
        }
    }

    private static String statusFor(IrrigationZone zone) {
        double allocated = zone.getAllocatedWater();
        double required = zone.getTotalWaterRequirement();
        if (allocated >= required) return "FULLY IRRIGATED";
        if (allocated > 0.0) return "PARTIALLY IRRIGATED";
        return "WAITING";
    }

    private static void writeRow(BufferedWriter writer, String[] values) throws IOException {
        for (int i = 0; i < values.length; i++) {
            if (i > 0) writer.write(',');
            writer.write(csvEscape(values[i] == null ? "" : values[i]));
        }
        writer.newLine();
    }

    /** Escapes commas, quotes and line breaks according to CSV rules. */
    private static String csvEscape(String value) {
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
