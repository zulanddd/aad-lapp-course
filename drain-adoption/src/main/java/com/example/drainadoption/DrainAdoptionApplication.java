package com.example.drainadoption;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Value;
import com.example.drainadoption.model.Drain;
import com.example.drainadoption.repository.DrainRepository;
import java.net.URI;
@SpringBootApplication(exclude=org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class)
public class DrainAdoptionApplication {
 public static void main(String[] args) {
  String connection=System.getenv("RENDER_DATABASE_CONNECTION");
  if(connection!=null&&!connection.isBlank()) configureRenderDatabase(connection);
  SpringApplication.run(DrainAdoptionApplication.class,args);
 }
 private static void configureRenderDatabase(String connection) {
  try {
   URI uri=new URI(connection);
   String credentials=uri.getUserInfo(), database=uri.getPath();
   if(!"postgresql".equals(uri.getScheme())||uri.getHost()==null||credentials==null||database==null||database.length()<2)
    throw new IllegalArgumentException();
   String[] account=credentials.split(":",2);
   if(account.length!=2||account[0].isBlank()||account[1].isBlank()) throw new IllegalArgumentException();
   int port=uri.getPort()<0?5432:uri.getPort();
   System.setProperty("spring.datasource.url","jdbc:postgresql://"+uri.getHost()+":"+port+database);
   System.setProperty("spring.datasource.username",account[0]);
   System.setProperty("spring.datasource.password",account[1]);
  } catch(java.net.URISyntaxException|IllegalArgumentException ex) {
   throw new IllegalStateException("RENDER_DATABASE_CONNECTION must be a valid Render internal Postgres URL.");
  }
 }
 @Bean CommandLineRunner seedDatabase(DrainRepository drains,@Value("${aad.seed-demo}") boolean demo) {
  return args -> { if(demo && drains.count()==0) {
   String[] names={"DEMO City centre location","DEMO Harbour location","DEMO Residential location"};
   double[][] points={{61.0583,28.1888},{61.0650,28.1880},{61.0490,28.1710}};
   for(int i=0;i<names.length;i++) { Drain d=new Drain();d.setName(names[i]);d.setLatitude(points[i][0]);d.setLongitude(points[i][1]);drains.save(d); }
  }};
 }
}
