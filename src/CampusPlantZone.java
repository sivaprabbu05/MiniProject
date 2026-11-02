
public class CampusPlantZone extends IrrigationZone {

    public CampusPlantZone(String zoneName, String plantType,
                           double area, double soilMoisture) {
        super(zoneName, plantType, area, soilMoisture);
    }

    @Override
    public void calculateWaterRequirement(double waterRatePerAcre) {
        // The prototype uses the same area-based formula for plant zones.
        double requirement = getArea() * waterRatePerAcre;
        setTotalWaterRequirement(requirement);
    }
}
