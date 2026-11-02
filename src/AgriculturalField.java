
public class AgriculturalField extends IrrigationZone {

    public AgriculturalField(String zoneName, String cropName,
                             double area, double soilMoisture) {
        super(zoneName, cropName, area, soilMoisture);
    }

    @Override
    public void calculateWaterRequirement(double waterRatePerAcre) {
        double requirement = getArea() * waterRatePerAcre;
        setTotalWaterRequirement(requirement);
    }
}
